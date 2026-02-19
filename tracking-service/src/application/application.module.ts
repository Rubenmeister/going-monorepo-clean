import { Module } from '@nestjs/common';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import {
  FindNearbyDriversUseCase,
  UpdateDriverLocationUseCase,
  CreateTrackingSessionUseCase,
  CompleteTrackingSessionUseCase,
} from './use-cases';

/**
 * Application Module
 * Provides use cases for the tracking service
 */
@Module({
  imports: [InfrastructureModule],
  providers: [
    FindNearbyDriversUseCase,
    UpdateDriverLocationUseCase,
    CreateTrackingSessionUseCase,
    CompleteTrackingSessionUseCase,
  ],
  exports: [
    FindNearbyDriversUseCase,
    UpdateDriverLocationUseCase,
    CreateTrackingSessionUseCase,
    CompleteTrackingSessionUseCase,
  ],
})
export class ApplicationModule {}
