import { Module } from '@nestjs/common';
import { 
  RequestTripUseCase, 
  AcceptTripUseCase, 
  SearchTripsUseCase, 
  GetTripByIdUseCase 
} from '@going-monorepo-clean/domains-transport-application';

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
