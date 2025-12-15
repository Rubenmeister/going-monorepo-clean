import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Shared Prisma Module
import { PrismaModule, PrismaService } from '@going-monorepo-clean/prisma-client';

// Domain Ports
import { ITourRepository } from '@going-monorepo-clean/domains-tour-core';

// Repository Implementation
import { PrismaTourRepository } from './persistence/prisma-tour.repository';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
  ],
  providers: [
    {
      provide: ITourRepository,
      useClass: PrismaTourRepository,
    },
    PrismaTourRepository,
  ],
  exports: [ITourRepository, PrismaTourRepository],
})
export class InfrastructureModule {}
