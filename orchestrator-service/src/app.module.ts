/**
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │  Wayra — orchestrator-service                                        │
 * │  "viento · movimiento"                                               │
 * │  Capa de ejecución. Polea Intentions de Yachay cada 5 min, las       │
 * │  mapea a acciones via RULES, aplica safety levels (Cat 1/2/3) y      │
 * │  despacha a Chaski (agent-bridge). Sin razonamiento — determinístico.│
 * └──────────────────────────────────────────────────────────────────────┘
 */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { HealthController } from './api/health.controller';
import { OrchestratorController } from './api/orchestrator.controller';
import { DecisionSchema } from './infrastructure/schemas/decision.schema';
import { DecisionRepository } from './infrastructure/persistence/decision.repository';
import { AgentOverrideSchema } from './infrastructure/schemas/agent-override.schema';
import { AgentOverrideRepository } from './infrastructure/persistence/agent-override.repository';
import { AgentBridgeClient } from './infrastructure/agent-bridge.client';
import { TelegramApprovalService } from './infrastructure/telegram-approval.service';
import { MycortexClient } from './infrastructure/mycortex.client';
import { RulesEngineService } from './decision/rules-engine.service';
import { DispatcherService } from './decision/dispatcher.service';
import { MyCortexPollerService } from './decision/mycortex-poller.service';
import { AgentOverrideService } from './decision/agent-override.service';
import { ActionVerifierService } from './decision/action-verifier.service';
import { OutcomeTrackerService } from './decision/outcome-tracker.service';
import { DriftDetectorService } from './decision/drift-detector.service';
import { ActionVerificationSchema } from './infrastructure/schemas/action-verification.schema';
import { OutcomeDailyStats, OutcomeDailyStatsSchema } from './infrastructure/schemas/outcome-daily-stats.schema';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // @Cron del MyCortexPollerService (cada 5 min). El poll necesita
    // min-instances=1 en Cloud Run sino el timer muere con scale-to-zero.
    ScheduleModule.forRoot(),
    MongooseModule.forRoot(
      process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017',
      {
        // DB nueva. Mismo cluster Atlas.
        dbName:                   'going-orchestrator',
        serverSelectionTimeoutMS: 30000,
        connectTimeoutMS:         30000,
        socketTimeoutMS:          45000,
        bufferCommands:           false,
      },
    ),
    MongooseModule.forFeature([
      { name: 'Decision', schema: DecisionSchema },
      { name: 'AgentOverride', schema: AgentOverrideSchema },
      { name: 'ActionVerification', schema: ActionVerificationSchema },
      { name: OutcomeDailyStats.name, schema: OutcomeDailyStatsSchema },
    ]),
  ],
  controllers: [
    HealthController,
    OrchestratorController,
  ],
  providers: [
    DecisionRepository,
    AgentOverrideRepository,
    AgentBridgeClient,
    TelegramApprovalService,
    MycortexClient,
    RulesEngineService,
    DispatcherService,
    MyCortexPollerService,
    AgentOverrideService,
    // Fase B cerebro autónomo — verifica métricas post-acción para los
    // intent.type listados en autonomous-allowlist.ts. El dispatcher lo
    // inyecta como @Optional, así que si está deshabilitado no rompe.
    ActionVerifierService,
    // Capa 4 mini — cron diario que mide success rate de las decisiones
    // autónomas. Endpoint /orchestrator/outcome-stats para consulta on-demand.
    OutcomeTrackerService,
    // Capa 4 media — cron semanal que detecta drift (degradación) en
    // success rate week-over-week. Hoy solo alerta, no muta runbook.
    DriftDetectorService,
  ],
})
export class AppModule {}
