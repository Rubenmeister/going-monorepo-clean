import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { HealthController } from './api/health.controller';
import { MyCortexController } from './api/mycortex.controller';
import { IntentionSchema } from './infrastructure/schemas/intention.schema';
import { CortexConfig, CortexConfigSchema } from './infrastructure/schemas/cortex-config.schema';
import { MemoryRollupSchema } from './infrastructure/schemas/memory-rollup.schema';
import { IntentionRepository } from './infrastructure/persistence/intention.repository';
import { CortexConfigRepository } from './infrastructure/persistence/cortex-config.repository';
import { MemoryRollupRepository } from './infrastructure/persistence/memory-rollup.repository';
import { WorldSnapshotClient } from './reasoning/world-snapshot.client';
import { AnthropicClient } from './reasoning/anthropic.client';
import { PromptBuilderService } from './reasoning/prompt-builder.service';
import { IntentionsParserService } from './reasoning/intentions-parser.service';
import { TelegramReporterService } from './reasoning/telegram-reporter.service';
import { CortexConfigService } from './reasoning/cortex-config.service';
import { ReasoningLoopService } from './reasoning/reasoning-loop.service';
import { MemoryRollupService } from './reasoning/memory-rollup.service';

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
      { name: 'Intention',          schema: IntentionSchema },
      { name: CortexConfig.name,    schema: CortexConfigSchema },
      { name: 'MemoryRollup',       schema: MemoryRollupSchema },
    ]),
  ],
  controllers: [
    HealthController,
    MyCortexController,
  ],
  providers: [
    IntentionRepository,
    CortexConfigRepository,
    MemoryRollupRepository,
    WorldSnapshotClient,
    AnthropicClient,
    CortexConfigService,
    PromptBuilderService,
    IntentionsParserService,
    TelegramReporterService,
    ReasoningLoopService,
    MemoryRollupService,
  ],
})
export class AppModule {}
