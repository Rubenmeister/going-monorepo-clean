import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WhatsAppController } from './api/whatsapp.controller';
import { ChatController } from './api/chat.controller';
import { HealthController } from './api/health.controller';
import { AgentService } from './agent/agent.service';
import { ConversationService } from './agent/conversation.service';
import { BookingService } from './booking/booking.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
  ],
})
export class AppModule {}
