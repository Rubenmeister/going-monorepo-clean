import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Shared Prisma Module
import { PrismaModule, PrismaService } from '@going-monorepo-clean/prisma-client';

// Repository
import { PrismaNotificationRepository } from './persistence/prisma-notification.repository';
import { LogNotificationGateway } from './gateways/log-notification.gateway';
import { ResendEmailGateway } from './gateways/resend-email.gateway';
import { TwilioSmsGateway } from './gateways/twilio-sms.gateway';
import { MetaWhatsAppGateway } from './gateways/meta-whatsapp.gateway';

export const I_NOTIFICATION_REPOSITORY = Symbol('INotificationRepository');

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
  ],
  providers: [
    LogNotificationGateway,
    ResendEmailGateway,
    TwilioSmsGateway,
    MetaWhatsAppGateway,
    {
      provide: 'INotificationGateway',
      useClass: LogNotificationGateway, // Default a Log por ahora
    },
    PrismaNotificationRepository,
    {
      provide: I_NOTIFICATION_REPOSITORY,
      useClass: PrismaNotificationRepository,
    },
  ],
  exports: [I_NOTIFICATION_REPOSITORY, PrismaNotificationRepository, PrismaService, 'INotificationGateway', LogNotificationGateway, ResendEmailGateway, TwilioSmsGateway, MetaWhatsAppGateway],
})
export class InfrastructureModule {}