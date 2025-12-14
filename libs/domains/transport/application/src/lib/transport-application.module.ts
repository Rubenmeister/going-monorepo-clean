import { Module } from '@nestjs/common';
import { AcceptTripUseCase } from './use-cases/accept-trip.use-case';
import { RequestTripUseCase } from './use-cases/request-trip.use-case';
// Import other use cases if needed

@Module({
  providers: [
    AcceptTripUseCase,
    RequestTripUseCase,
  ],
  exports: [
    AcceptTripUseCase,
    RequestTripUseCase,
  ],
})
export class TransportApplicationModule {}
