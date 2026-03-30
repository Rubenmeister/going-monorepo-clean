import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationController } from './api/notification.controller';
import { HealthController } from './api/health.controller';
import { NotificationService } from './application/services/notification.service';
import { NotificationPreferencesService } from './application/services/notification-preferences.service';
import { FcmService } from './application/services/fcm.service';
import { NotificationGateway } from './infrastructure/gateways/notification.gateway';
import { NotificationRepository } from './infrastructure/persistence/notification.repository';
import { DeviceTokenRepository } from './infrastructure/persistence/device-token.repository';
import { NotificationPreferencesRepository } from './infrastructure/persistence/notification-preferences.repository';
import {
  NotificationSchema,
  NotificationSchemaDefinition,
} from './infrastructure/schemas/notification.schema';
import {
  DeviceTokenSchema,
  DeviceTokenSchemaDefinition,
} from './infrastructure/schemas/device-token.schema';
import {
  NotificationPreferencesSchema,
  NotificationPreferencesSchemaDefinition,
} from './infrastructure/schemas/notification-preferences.schema';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get('MONGODB_URI', 'mongodb://localhost:27017/notifications'),
        lazyConnection: true,
        connectionFactory: (conn: any) => {
          conn.on('error', (e: Error) => console.warn('MongoDB:', e.message));
          return conn;
        },
      }),
    }),
    MongooseModule.forFeature([
      { name: NotificationSchema.name, schema: NotificationSchemaDefinition },
      { name: DeviceTokenSchema.name, schema: DeviceTokenSchemaDefinition },
      {
        name: NotificationPreferencesSchema.name,
        schema: NotificationPreferencesSchemaDefinition,
      },
    ]),
  ],
  controllers: [NotificationController, HealthController],
  providers: [
    NotificationService,
    NotificationPreferencesService,
    FcmService,
    NotificationGateway,
    NotificationRepository,
    DeviceTokenRepository,
    NotificationPreferencesRepository,
  ],
})
export class AppModule {}
