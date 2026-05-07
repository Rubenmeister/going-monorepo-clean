import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { HealthController } from './api/health.controller';
import { CerebroController } from './api/cerebro.controller';
import { AgentEventSchema } from './infrastructure/schemas/agent-event.schema';
import { AgentEventRepository } from './infrastructure/persistence/agent-event.repository';
import { EventHandlerService } from './infrastructure/event-handler.service';
import { PubSubSubscriberService } from './infrastructure/pubsub-subscriber.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // ScheduleModule reservado para Fase 2: el WorldModelService va a
    // generar snapshots cada 10 min con @Cron.
    ScheduleModule.forRoot(),
    MongooseModule.forRoot(
      process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017',
      {
        // DB nueva, separada del resto del producto. Mismo cluster Atlas.
        dbName:                   'going-cerebro',
        serverSelectionTimeoutMS: 30000,
        connectTimeoutMS:         30000,
        socketTimeoutMS:          45000,
        bufferCommands:           false,
      },
    ),
    MongooseModule.forFeature([
      { name: 'AgentEvent', schema: AgentEventSchema },
    ]),
  ],
  controllers: [
    HealthController,
    CerebroController,
  ],
  providers: [
    AgentEventRepository,
    EventHandlerService,
    PubSubSubscriberService,
  ],
})
export class AppModule {}
