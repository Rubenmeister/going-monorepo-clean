import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  INotificationRepository,
  INotificationGateway,
} from '@going-monorepo-clean/domains-notification-core';
import { IMessageRepository } from '../domain/ports';
import { MongooseNotificationRepository } from './persistence/mongoose-notification.repository';
import {
  NotificationModelSchema,
  NotificationSchema,
} from './persistence/schemas/notification.schema';
import { SendGridEmailGateway } from './gateways/email-notification.gateway';
import { TwilioSmsGateway } from './gateways/sms-notification.gateway';
import { FirebasePushNotificationGateway } from './gateways/push-notification.gateway';
import { CompositeNotificationGateway } from './gateways/composite-notification.gateway';
import { DeviceTokenRepository } from './persistence/device-token.repository';
import { DeviceTokenSchema } from './persistence/schemas/device-token.schema';
import { MongoMessageRepository } from './persistence/mongo-message.repository';
import { Message, MessageSchema } from './schemas/message.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NotificationModelSchema.name, schema: NotificationSchema },
      // Use hardcoded string 'DeviceToken' because webpack infers DeviceToken.name
      // from the const assignment (not the class name DeviceTokenModelSchema)
      { name: 'DeviceToken', schema: DeviceTokenSchema },
      // Message schema for chat functionality
      { name: 'Message', schema: MessageSchema },
    ]),
  ],
  providers: [
    {
      provide: INotificationRepository,
      useClass: MongooseNotificationRepository,
    },
    // Message repository for chat endpoints
    {
      provide: IMessageRepository,
      useClass: MongoMessageRepository,
    },
    // Device token repository (required by FirebasePushNotificationGateway)
    DeviceTokenRepository,
    // Channel-specific gateways
    SendGridEmailGateway,
    TwilioSmsGateway,
    FirebasePushNotificationGateway,
    // Composite gateway routes to the correct channel gateway
    {
      provide: INotificationGateway,
      useClass: CompositeNotificationGateway,
    },
  ],
  exports: [INotificationRepository, INotificationGateway, IMessageRepository, DeviceTokenRepository],
})
export class InfrastructureModule {}
