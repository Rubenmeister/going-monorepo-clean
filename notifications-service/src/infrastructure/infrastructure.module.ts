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
import { EmailNotificationGateway } from './gateways/email-notification.gateway';
import { SmsNotificationGateway } from './gateways/sms-notification.gateway';
import { PushNotificationGateway } from './gateways/push-notification.gateway';
import { CompositeNotificationGateway } from './gateways/composite-notification.gateway';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NotificationModelSchema.name, schema: NotificationSchema },
    ]),
  ],
  providers: [
    {
      provide: INotificationRepository,
      useClass: MongooseNotificationRepository,
    },
    // Channel-specific gateways
    EmailNotificationGateway,
    SmsNotificationGateway,
    PushNotificationGateway,
    // Composite gateway routes to the correct channel gateway
    {
      provide: INotificationGateway,
      useClass: CompositeNotificationGateway,
    },
  ],
  exports: [
    INotificationRepository,
    INotificationGateway,
  ],
})
export class InfrastructureModule {}
