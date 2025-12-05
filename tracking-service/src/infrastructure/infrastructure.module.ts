import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Shared Prisma Module
import { PrismaModule, PrismaService } from '@going-monorepo-clean/prisma-client';

// Repository
import { PrismaTrackingRepository } from './persistence/prisma-tracking.repository';

export const I_TRACKING_REPOSITORY = Symbol('ITrackingRepository');

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
  ],
  providers: [
    PrismaTrackingRepository,
    {
      provide: I_TRACKING_REPOSITORY,
      useClass: PrismaTrackingRepository,
    },
  ],
  exports: [I_TRACKING_REPOSITORY, PrismaTrackingRepository, PrismaService],
})
export class InfrastructureModule {}