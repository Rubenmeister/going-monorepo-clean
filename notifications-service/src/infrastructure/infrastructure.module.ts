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
import { LogNotificationGateway } from './gateways/log-notification.gateway';

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
    {
      provide: INotificationGateway,
      useClass: LogNotificationGateway,
    },
  ],
  exports: [
    INotificationRepository,
    INotificationGateway,
  ],
})
export class InfrastructureModule {}