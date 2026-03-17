import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  INotificationRepository,
  INotificationGateway,
} from '@going-monorepo-clean/domains-notification-core';
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
import {
  DeviceToken,
  DeviceTokenSchema,
} from './persistence/schemas/device-token.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NotificationModelSchema.name, schema: NotificationSchema },
      { name: DeviceToken.name, schema: DeviceTokenSchema },
    ]),
  ],
  providers: [
    {
      provide: INotificationRepository,
      useClass: MongooseNotificationRepository,
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
  exports: [INotificationRepository, INotificationGateway],
})
export class InfrastructureModule {}
