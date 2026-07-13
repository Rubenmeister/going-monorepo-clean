/**
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │  Yachay — mycortex-service                                           │
 * │  "conocimiento · sabiduría"                                          │
 * │  Capa cognitiva. ÚNICA capa que invoca Claude. Lee snapshots de      │
 * │  Pacha cada 30 min + memoria reciente y produce Intentions ("qué    │
 * │  hacer"). Wayra (orchestrator) las consume y decide cómo ejecutar.   │
 * └──────────────────────────────────────────────────────────────────────┘
 */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { HealthController } from './api/health.controller';
import { MyCortexController } from './api/mycortex.controller';
import { IntentionSchema } from './infrastructure/schemas/intention.schema';
import { CortexConfig, CortexConfigSchema } from './infrastructure/schemas/cortex-config.schema';
import { BusinessContext, BusinessContextSchema } from './infrastructure/schemas/business-context.schema';
import { MemoryRollupSchema } from './infrastructure/schemas/memory-rollup.schema';
import { ConfigAuditSchema } from './infrastructure/schemas/config-audit.schema';
import { IntentionRepository } from './infrastructure/persistence/intention.repository';
import { CortexConfigRepository } from './infrastructure/persistence/cortex-config.repository';
import { BusinessContextRepository } from './infrastructure/persistence/business-context.repository';
import { MemoryRollupRepository } from './infrastructure/persistence/memory-rollup.repository';
import { ConfigAuditRepository } from './infrastructure/persistence/config-audit.repository';
import { WorldSnapshotClient } from './reasoning/world-snapshot.client';
import { AnthropicClient } from './reasoning/anthropic.client';
import { PromptBuilderService } from './reasoning/prompt-builder.service';
import { IntentionsParserService } from './reasoning/intentions-parser.service';
import { TelegramReporterService } from './reasoning/telegram-reporter.service';
import { CortexConfigService } from './reasoning/cortex-config.service';
import { BusinessContextService } from './reasoning/business-context.service';
import { ReasoningLoopService } from './reasoning/reasoning-loop.service';
import { MemoryRollupService } from './reasoning/memory-rollup.service';
import { AnomalyRulesService } from './reasoning/anomaly-rules.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Habilita @Cron para el ReasoningLoopService (cada 30 min).
    ScheduleModule.forRoot(),
    MongooseModule.forRoot(
      process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017',
      {
        // DB nueva, separada del cerebro-service. Mismo cluster Atlas.
        dbName:                   'going-mycortex',
        serverSelectionTimeoutMS: 30000,
        connectTimeoutMS:         30000,
        socketTimeoutMS:          45000,
        bufferCommands:           false,
      },
    ),
    MongooseModule.forFeature([
      { name: 'Intention',           schema: IntentionSchema },
      { name: CortexConfig.name,     schema: CortexConfigSchema },
      { name: BusinessContext.name,  schema: BusinessContextSchema },
      { name: 'MemoryRollup',        schema: MemoryRollupSchema },
      { name: 'ConfigAudit',         schema: ConfigAuditSchema },
    ]),
  ],
  controllers: [
    HealthController,
    MyCortexController,
  ],
  providers: [
    IntentionRepository,
    CortexConfigRepository,
    BusinessContextRepository,
    MemoryRollupRepository,
    ConfigAuditRepository,
    WorldSnapshotClient,
    AnthropicClient,
    CortexConfigService,
    BusinessContextService,
    PromptBuilderService,
    IntentionsParserService,
    TelegramReporterService,
    ReasoningLoopService,
    MemoryRollupService,
    // AnomalyRulesService — Capa 1 del cerebro proactivo. Traduce
    // determinísticamente anomalies a Intentions (sin LLM) para garantizar
    // que patrones críticos como spammer voice se procesen aunque Claude
    // no los detecte en su prompt.
    AnomalyRulesService,
  ],
})
export class AppModule {}
