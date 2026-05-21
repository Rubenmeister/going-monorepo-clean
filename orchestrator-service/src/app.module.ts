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
import { AgentBridgeClient } from './infrastructure/agent-bridge.client';
import { TelegramApprovalService } from './infrastructure/telegram-approval.service';
import { MycortexClient } from './infrastructure/mycortex.client';
import { RulesEngineService } from './decision/rules-engine.service';
import { DispatcherService } from './decision/dispatcher.service';
import { MyCortexPollerService } from './decision/mycortex-poller.service';

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
    ]),
  ],
  controllers: [
    HealthController,
    OrchestratorController,
  ],
  providers: [
    DecisionRepository,
    AgentBridgeClient,
    TelegramApprovalService,
    MycortexClient,
    RulesEngineService,
    DispatcherService,
    MyCortexPollerService,
  ],
})
export class AppModule {}
