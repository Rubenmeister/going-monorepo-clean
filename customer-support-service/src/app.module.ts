import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { WhatsAppController } from './api/whatsapp.controller';
import { TelegramController } from './api/telegram.controller';
import { ChatController } from './api/chat.controller';
import { HealthController } from './api/health.controller';
import { MetricsController } from './api/metrics.controller';
import { CommandController } from './api/command.controller';
import { AgentService } from './agent/agent.service';
import { ConversationService } from './agent/conversation.service';
import { VoiceGatewayService } from './agent/voice-gateway.service';
import { BookingService } from './booking/booking.service';
import { VoiceService } from './infrastructure/voice.service';
import { TelegramService } from './infrastructure/telegram.service';
import { WhatsAppService } from './infrastructure/whatsapp.service';
import { HandoffNotifierService } from './infrastructure/handoff-notifier.service';
import { MetricsService } from './infrastructure/metrics.service';
import { CerebroPublisherService } from './infrastructure/cerebro-publisher.service';
import { OpenAIRealtimeAdapter } from './infrastructure/openai-realtime.adapter';
import { LocationService } from './knowledge-base/location.service';
import { ConversationSchema } from './infrastructure/schemas/conversation.schema';
import { MongoConversationRepository } from './infrastructure/persistence/mongo-conversation.repository';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Habilita @Cron decorators (CerebroPublisherService publica al cerebro
    // cada 10 min). El cron del scheduler corre dentro del proceso NestJS
    // — un único proceso del Cloud Run Service hace el publish global.
    ScheduleModule.forRoot(),
    MongooseModule.forRoot(
      process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017',
      {
        dbName:                   'going-support',
        // Patrón estable usado por user-auth-service: timeouts cortos
        // y bufferCommands:false para que el container no quede colgado
        // si Mongo está caído al startup. NestJS bootstrap continúa.
        serverSelectionTimeoutMS: 30000,
        connectTimeoutMS:         30000,
        socketTimeoutMS:          45000,
        bufferCommands:           false,
      },
    ),
    MongooseModule.forFeature([
      { name: 'Conversation', schema: ConversationSchema },
    ]),
  ],
  controllers: [
    WhatsAppController,
    TelegramController,
    ChatController,
    HealthController,
    MetricsController,
    CommandController,
  ],
  providers: [
    AgentService,
    ConversationService,
    BookingService,
    VoiceService,
    TelegramService,
    WhatsAppService,
    HandoffNotifierService,
    LocationService,
    MongoConversationRepository,
    MetricsService,
    CerebroPublisherService,
    OpenAIRealtimeAdapter,
    VoiceGatewayService,
  ],
})
export class AppModule {}
