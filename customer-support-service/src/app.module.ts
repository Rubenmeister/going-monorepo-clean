import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { WhatsAppController } from './api/whatsapp.controller';
import { ChatController } from './api/chat.controller';
import { HealthController } from './api/health.controller';
import { AgentService } from './agent/agent.service';
import { ConversationService } from './agent/conversation.service';
import { BookingService } from './booking/booking.service';
import { ConversationSchema } from './infrastructure/schemas/conversation.schema';
import { MongoConversationRepository } from './infrastructure/persistence/mongo-conversation.repository';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/going-support'
    ),
    MongooseModule.forFeature([
      { name: 'Conversation', schema: ConversationSchema },
    ]),
  ],
  controllers: [
    WhatsAppController,
    ChatController,
    HealthController,
  ],
  providers: [
    AgentService,
    ConversationService,
    BookingService,
    MongoConversationRepository,
  ],
})
export class AppModule {}
