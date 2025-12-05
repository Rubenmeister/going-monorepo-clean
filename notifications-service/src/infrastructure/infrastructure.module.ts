import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Shared Prisma Module
import { PrismaModule, PrismaService } from '@going-monorepo-clean/prisma-client';

// Repository
import { PrismaNotificationRepository } from './persistence/prisma-notification.repository';

export const I_NOTIFICATION_REPOSITORY = Symbol('INotificationRepository');

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
  ],
  providers: [
    PrismaNotificationRepository,
    {
      provide: I_NOTIFICATION_REPOSITORY,
      useClass: PrismaNotificationRepository,
    },
  ],
  exports: [I_NOTIFICATION_REPOSITORY, PrismaNotificationRepository, PrismaService],
})
export class InfrastructureModule {}