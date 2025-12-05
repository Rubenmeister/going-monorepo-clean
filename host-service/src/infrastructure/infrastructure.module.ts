import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Shared Prisma Module
import { PrismaModule } from '@going-monorepo-clean/prisma-client';

// Domain Ports
import { I_HOST_REPOSITORY } from '@going-monorepo-clean/domains-anfitriones-core';
import { IAccommodationRepository } from '@going-monorepo-clean/domains-accommodation-core';

// Infrastructure Implementations
import { PrismaHostRepository } from './prisma-host.repository';
import { PrismaAccommodationRepository } from './prisma-accommodation.repository';

// Injection token for accommodation
export const I_ACCOMMODATION_REPOSITORY = Symbol('IAccommodationRepository');

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
  ],
  providers: [
    {
      provide: I_HOST_REPOSITORY,
      useClass: PrismaHostRepository,
    },
    {
      provide: I_ACCOMMODATION_REPOSITORY,
      useClass: PrismaAccommodationRepository,
    },
  ],
  exports: [I_HOST_REPOSITORY, I_ACCOMMODATION_REPOSITORY],
})
export class InfrastructureModule {}