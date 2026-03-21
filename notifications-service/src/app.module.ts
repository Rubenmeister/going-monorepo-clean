import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { NotificationController } from './api/notification.controller';
import { HealthController } from './api/health.controller';
import {
  SendNotificationUseCase,
  GetUserNotificationsUseCase,
} from '@going-monorepo-clean/domains-notification-application';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.NOTIFICATION_DB_URL, {
      lazyConnection: true,
      connectionFactory: (conn) => {
        conn.on('error', (e) => console.warn('MongoDB:', e.message));
        return conn;
      },
    }), // .env
    InfrastructureModule,
  ],
  controllers: [NotificationController, HealthController],
  providers: [SendNotificationUseCase, GetUserNotificationsUseCase],
})
export class AppModule {}
