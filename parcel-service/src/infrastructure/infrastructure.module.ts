import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Shared Prisma Module
import { PrismaModule } from '@going-monorepo-clean/prisma-client';

// Domain Ports
import { I_PARCEL_REPOSITORY } from '@going-monorepo-clean/domains-parcel-core';

// Infrastructure Implementations  
import { PrismaParcelRepository } from './persistence/prisma-parcel.repository';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
  ],
  providers: [
    {
      provide: I_PARCEL_REPOSITORY,
      useClass: PrismaParcelRepository,
    },
  ],
  exports: [I_PARCEL_REPOSITORY],
})
export class InfrastructureModule {}