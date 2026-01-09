import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TransportController } from './transport.controller';
import { PrismaModule } from '@going-monorepo-clean/prisma-client';
import { PrismaTransportRepository } from '../infrastructure/persistence/prisma-transport.repository';
import { ITripRepository } from '@going-monorepo-clean/domains-transport-core';
import { FindAllTransportsUseCase } from './queries/find-all-transports.use-case';
import { DeleteTransportUseCase } from './commands/delete-transport.use-case';

import { SharedLoggerModule } from '@going-monorepo/shared-backend';

@Module({
  imports: [PrismaModule, SharedLoggerModule],
  controllers: [AppController, TransportController],
  providers: [
    AppService,
    FindAllTransportsUseCase,
    DeleteTransportUseCase,
    {
      provide: ITripRepository,
      useClass: PrismaTransportRepository,
    },
  ],
})
export class AppModule {}
