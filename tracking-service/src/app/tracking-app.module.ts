import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from '@going-monorepo-clean/prisma-client';
import { TrackingController } from '../api/tracking.controller';
import { TrackingGateway } from '../api/tracking.gateway';
import { PrismaTrackingRepository } from '../infrastructure/persistence/prisma-tracking.repository';
import { InMemoryDriverLocationRepository } from '../infrastructure/persistence/in-memory-driver-location.repository';
import {
  CreateTrackingEventUseCase,
  UpdateDriverLocationUseCase,
} from '@going-monorepo-clean/domains-tracking-application';
import {
  I_TRACKING_REPOSITORY,
  ITrackingRepository,
  I_DRIVER_LOCATION_REPOSITORY,
  IDriverLocationRepository,
  I_DRIVER_LOCATION_GATEWAY,
  IDriverLocationGateway,
} from '@going-monorepo-clean/domains-tracking-core';

@Module({
  imports: [PrismaModule],
  controllers: [AppController, TrackingController],
  providers: [
    AppService,
    TrackingGateway,
    {
      provide: I_TRACKING_REPOSITORY,
      useClass: PrismaTrackingRepository,
    },
    {
      provide: I_DRIVER_LOCATION_REPOSITORY,
      useClass: InMemoryDriverLocationRepository,
    },
    {
      provide: I_DRIVER_LOCATION_GATEWAY,
      useExisting: TrackingGateway,
    },
    {
      provide: CreateTrackingEventUseCase,
      useFactory: (repo: ITrackingRepository) => new CreateTrackingEventUseCase(repo),
      inject: [I_TRACKING_REPOSITORY],
    },
    {
      provide: UpdateDriverLocationUseCase,
      useFactory: (repo: IDriverLocationRepository, gateway: IDriverLocationGateway) => new UpdateDriverLocationUseCase(repo, gateway),
      inject: [I_DRIVER_LOCATION_REPOSITORY, I_DRIVER_LOCATION_GATEWAY],
    },
  ],
})
export class TrackingAppModule {}
