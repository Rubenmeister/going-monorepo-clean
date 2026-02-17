import { Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import {
  ITrackingRepository,
  Geofence,
} from '@going-monorepo-clean/domains-tracking-core';
import { GetDriverLocationForTripDto, DriverLocationForTripResultDto } from '../dto/get-driver-location-for-trip.dto';

const DEFAULT_SPEED_KMH = 30;

@Injectable()
export class GetDriverLocationForTripUseCase {
  constructor(
    @Inject(ITrackingRepository)
    private readonly trackingRepo: ITrackingRepository,
  ) {}

  async execute(
    dto: GetDriverLocationForTripDto,
    destinationLat?: number,
    destinationLng?: number,
  ): Promise<DriverLocationForTripResultDto> {
    const result = await this.trackingRepo.findByDriverId(dto.driverId);

    if (result.isErr()) {
      throw new InternalServerErrorException(result.error.message);
    }

    const driverLocation = result.value;
    if (!driverLocation) {
      throw new NotFoundException(`No active location found for driver ${dto.driverId}`);
    }

    const props = driverLocation.toPrimitives();
    const response: DriverLocationForTripResultDto = {
      driverId: props.driverId,
      tripId: dto.tripId,
      latitude: props.location.latitude,
      longitude: props.location.longitude,
      updatedAt: props.updatedAt,
    };

    // Calculate ETA if destination is provided
    if (destinationLat !== undefined && destinationLng !== undefined) {
      const distanceKm = Geofence.haversineKm(
        props.location.latitude,
        props.location.longitude,
        destinationLat,
        destinationLng,
      );
      response.etaMinutes = Math.round((distanceKm / DEFAULT_SPEED_KMH) * 60 * 10) / 10;
    }

    return response;
  }
}
