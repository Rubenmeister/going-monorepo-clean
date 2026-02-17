import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventEmitterModule } from '@nestjs/event-emitter';
import {
  INotificationRepository,
  INotificationGateway,
  IChatMessageRepository,
  IWhatsAppNotificationGateway,
} from '@going-monorepo-clean/domains-notification-core';
import { MongooseNotificationRepository } from './persistence/mongoose-notification.repository';
import { MongooseChatMessageRepository } from './persistence/mongoose-chat-message.repository';
import {
  NotificationModelSchema,
  NotificationSchema,
} from './persistence/schemas/notification.schema';
import {
  ChatMessageModelSchema,
  ChatMessageSchema,
} from './persistence/schemas/chat-message.schema';
import { LogNotificationGateway } from './gateways/log-notification.gateway';
import { TwilioWhatsAppGateway } from './gateways/twilio-whatsapp.gateway';
import { TripNotificationListener } from './listeners/trip-notification.listener';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NotificationModelSchema.name, schema: NotificationSchema },
      { name: ChatMessageModelSchema.name, schema: ChatMessageSchema },
    ]),
    EventEmitterModule.forRoot(),
  ],
  providers: [
    {
      provide: INotificationRepository,
      useClass: MongooseNotificationRepository,
    },
    {
      provide: INotificationGateway,
      useClass: LogNotificationGateway,
    },
    {
      provide: IChatMessageRepository,
      useClass: MongooseChatMessageRepository,
    },
    {
      provide: IWhatsAppNotificationGateway,
      useClass: TwilioWhatsAppGateway,
    },
    TripNotificationListener,
  ],
  exports: [
    INotificationRepository,
    INotificationGateway,
    IChatMessageRepository,
    IWhatsAppNotificationGateway,
  ],
})
export class InfrastructureModule {}