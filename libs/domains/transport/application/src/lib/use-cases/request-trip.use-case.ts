import { Inject, Injectable } from '@nestjs/common';
import {
  Trip,
  ITripRepository,
  VehicleType,
  TravelMode,
} from '@going-monorepo-clean/domains-transport-core';
import { RequestTripDto } from '../dto/request-trip.dto';

@Injectable()
export class RequestTripUseCase {
  constructor(
    @Inject(ITripRepository)
    private readonly tripRepo: ITripRepository,
  ) {}

  async execute(dto: RequestTripDto): Promise<{ id: string }> {
    // Assuming DTO has necessary fields, mapping them to entity creation
    // Note: The DTO might need updates to match new Trip entity props
    
    const trip = Trip.create({
      driverId: dto.driverId || 'PENDING', // Needs logic
      vehicleType: (dto.vehicleType as VehicleType) || 'SUV',
      mode: (dto.mode as TravelMode) || 'POINT_TO_POINT',
      originCity: dto.origin.city,
      originAddress: dto.origin.address,
      destCity: dto.destination.city,
      destAddress: dto.destination.address,
      departureTime: new Date(dto.departureTime),
      basePrice: dto.price.amount,
      currency: dto.price.currency,
    });

    await this.tripRepo.save(trip);

    return { id: trip.id };
  }
}