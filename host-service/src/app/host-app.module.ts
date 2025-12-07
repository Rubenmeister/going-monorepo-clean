import { Module } from '@nestjs/common';
import { PrismaModule } from '@going-monorepo-clean/prisma-client';
import { PrismaHostRepository } from '../infrastructure/persistence/prisma-host.repository';
import { CreateHostUseCase } from '@going-monorepo-clean/domains-anfitriones-application';
import {
  I_HOST_REPOSITORY,
  IHostRepository,
} from '@going-monorepo-clean/domains-anfitriones-core';

@Module({
  imports: [PrismaModule],
  controllers: [],
  providers: [
    {
      provide: I_HOST_REPOSITORY,
      useClass: PrismaHostRepository,
    },
    {
      provide: CreateHostUseCase,
      useFactory: (repo: IHostRepository) => new CreateHostUseCase(repo),
      inject: [I_HOST_REPOSITORY],
    },
  ],
})
export class HostAppModule {}
