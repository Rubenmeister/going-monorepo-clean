import { Module } from '@nestjs/common';
import { RequestTripUseCase } from './use-cases/request-trip.use-case';
import { AcceptTripUseCase } from './use-cases/accept-trip.use-case';
import { SearchTripsUseCase } from './use-cases/search-trips.use-case';
import { GetTripByIdUseCase } from './use-cases/get-trip-by-id.use-case';

@Module({
  providers: [
    RequestTripUseCase,
    AcceptTripUseCase,
    SearchTripsUseCase,
    GetTripByIdUseCase,
  ],
  exports: [
    RequestTripUseCase,
    AcceptTripUseCase,
    SearchTripsUseCase,
    GetTripByIdUseCase,
  ],
})
export class TransportApplicationModule {}
