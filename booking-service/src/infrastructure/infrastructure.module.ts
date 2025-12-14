import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Shared Prisma Module
import { PrismaModule, PrismaService } from '@going-monorepo-clean/prisma-client';

// Repository
import { PrismaBookingRepository } from './persistence/prisma-booking.repository';

export const I_BOOKING_REPOSITORY = Symbol('IBookingRepository');

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
  ],
  providers: [
    PrismaBookingRepository,
    {
      provide: I_BOOKING_REPOSITORY,
      useClass: PrismaBookingRepository,
    },
  ],
  exports: [I_BOOKING_REPOSITORY, PrismaBookingRepository, PrismaService],
})
export class InfrastructureModule {}