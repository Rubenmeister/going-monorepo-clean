import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Shared Prisma Module
import { PrismaModule, PrismaService } from '@going-monorepo-clean/prisma-client';

// Domain Ports
import { ITripRepository } from '@going-monorepo-clean/domains-transport-core';

// Repository Implementation
import { PrismaTransportRepository } from './persistence/prisma-transport.repository';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
  ],
  providers: [
    {
      provide: ITripRepository,
      useClass: PrismaTransportRepository,
    },
    PrismaTransportRepository,
  ],
  exports: [ITripRepository, PrismaTransportRepository],
})
export class InfrastructureModule {}