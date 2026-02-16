import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from '@going-monorepo-clean/shared-domain';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { NotificationController } from './api/notification.controller';
import {
  SendNotificationUseCase,
  GetUserNotificationsUseCase,
} from '@going-monorepo-clean/domains-notification-application';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    MongooseModule.forRoot(process.env.NOTIFICATION_DB_URL),
    InfrastructureModule,
  ],
  controllers: [
    NotificationController,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    SendNotificationUseCase,
    GetUserNotificationsUseCase,
  ],
})
export class AppModule {}