import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Shared Prisma Module
import { PrismaModule, PrismaService } from '@going-monorepo-clean/prisma-client';

// Repository
import { PrismaNotificationRepository } from './persistence/prisma-notification.repository';

// Notification Gateways
import { LogNotificationGateway } from './gateways/log-notification.gateway';
import { ResendEmailGateway } from './gateways/resend-email.gateway';
import { TwilioSmsGateway } from './gateways/twilio-sms.gateway';
import { MetaWhatsAppGateway } from './gateways/meta-whatsapp.gateway';
import { FcmPushGateway } from './gateways/fcm-push.gateway';

export const I_NOTIFICATION_REPOSITORY = Symbol('INotificationRepository');

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
  ],
  providers: [
    // Notification Gateways
    LogNotificationGateway,
    ResendEmailGateway,
    TwilioSmsGateway,
    MetaWhatsAppGateway,
    FcmPushGateway,
    {
      provide: 'INotificationGateway',
      useClass: LogNotificationGateway, // Default fallback gateway
    },
    // Repository
    PrismaNotificationRepository,
    {
      provide: I_NOTIFICATION_REPOSITORY,
      useClass: PrismaNotificationRepository,
    },
  ],
  exports: [
    I_NOTIFICATION_REPOSITORY,
    PrismaNotificationRepository,
    PrismaService,
    'INotificationGateway',
    LogNotificationGateway,
    ResendEmailGateway,
    TwilioSmsGateway,
    MetaWhatsAppGateway,
    FcmPushGateway,
  ],
})
export class InfrastructureModule {}