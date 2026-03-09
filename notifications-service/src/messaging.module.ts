import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

// Controllers
import { ChatController } from './api/chat.controller';
import { NotificationController } from './api/notification.controller';

// Use Cases
import { SendMessageUseCase } from '@going-monorepo-clean/domains-notification-application';
import { GetConversationUseCase } from '@going-monorepo-clean/domains-notification-application';
import { MarkMessageAsReadUseCase } from '@going-monorepo-clean/domains-notification-application';
import { GetOnlineUsersUseCase } from '@going-monorepo-clean/domains-notification-application';
import { SendNotificationUseCase } from '@going-monorepo-clean/domains-notification-application';

// Repositories
import { MongoMessageRepository } from './infrastructure/persistence/mongo-message.repository';
import { IMessageRepository } from '@going-monorepo-clean/domains-notification-core';

// Gateways
import { ChatGateway } from './infrastructure/gateways/chat.gateway';
import { IChatGateway } from '@going-monorepo-clean/domains-notification-core';
import { FirebasePushNotificationGateway } from './infrastructure/gateways/push-notification.gateway';
import { TwilioSmsGateway } from './infrastructure/gateways/sms-notification.gateway';
import { SendGridEmailGateway } from './infrastructure/gateways/email-notification.gateway';
import { CompositeNotificationGateway } from './infrastructure/gateways/composite-notification.gateway';
import { INotificationGateway } from '@going-monorepo-clean/domains-notification-core';

// Schemas
import { MessageSchema } from './infrastructure/schemas/message.schema';
import { ConversationSchema } from './infrastructure/schemas/conversation.schema';
import {
  DeviceToken,
  DeviceTokenSchema,
} from './infrastructure/schemas/device-token.schema';
import { DeviceTokenRepository } from './infrastructure/persistence/device-token.repository';

/**
 * Messaging Module
 * Wires up all dependencies for Phase 5 Messaging & Chat System
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Message', schema: MessageSchema },
      { name: 'Conversation', schema: ConversationSchema },
      { name: DeviceToken.name, schema: DeviceTokenSchema },
    ]),
  ],
  controllers: [ChatController, NotificationController],
  providers: [
    // Use Cases
    SendMessageUseCase,
    GetConversationUseCase,
    MarkMessageAsReadUseCase,
    GetOnlineUsersUseCase,
    SendNotificationUseCase,

    // Repositories
    {
      provide: IMessageRepository,
      useClass: MongoMessageRepository,
    },

    // Gateways
    {
      provide: IChatGateway,
      useClass: ChatGateway,
    },
    {
      provide: INotificationGateway,
      useClass: CompositeNotificationGateway,
    },

    // Device token repository (needed by FCM gateway)
    DeviceTokenRepository,

    // Gateway Providers (for Composite Gateway to inject)
    FirebasePushNotificationGateway,
    TwilioSmsGateway,
    SendGridEmailGateway,

    // WebSocket Gateway
    ChatGateway,
  ],
  exports: [
    SendMessageUseCase,
    GetConversationUseCase,
    MarkMessageAsReadUseCase,
    GetOnlineUsersUseCase,
    SendNotificationUseCase,
    IMessageRepository,
    IChatGateway,
    INotificationGateway,
  ],
})
export class MessagingModule {}
