import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { NotificationController } from './api/notification.controller';
import {
  SendNotificationUseCase,
  GetUserNotificationsUseCase,
} from '@going-monorepo-clean/domains-notification-application';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.NOTIFICATION_DB_URL), // .env
    InfrastructureModule,
  ],
  controllers: [
    NotificationController,
  ],
  providers: [
    SendNotificationUseCase,
    GetUserNotificationsUseCase,
  ],
})
export class AppModule {}