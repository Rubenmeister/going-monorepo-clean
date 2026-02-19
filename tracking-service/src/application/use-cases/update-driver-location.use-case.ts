import { Injectable, Inject } from '@nestjs/common';
import {
  GeoLocation,
  Coordinates,
  IGeoLocationRepository,
  IDriverAvailabilityRepository,
} from '@going/shared-infrastructure';

/**
 * Update Driver Location Use Case
 * Updates the current location of a driver
 */
@Injectable()
export class UpdateDriverLocationUseCase {
  constructor(
    @Inject('IGeoLocationRepository')
    private readonly geoLocationRepo: IGeoLocationRepository,
    @Inject('IDriverAvailabilityRepository')
    private readonly availabilityRepo: IDriverAvailabilityRepository
  ) {}

  async execute(input: {
    driverId: string;
    latitude: number;
    longitude: number;
    accuracy: number;
    heading?: number;
    speed?: number;
  }): Promise<{ success: boolean; message: string }> {
    const { driverId, latitude, longitude, accuracy, heading, speed } = input;

    // Validate coordinates
    const coordinates = new Coordinates(latitude, longitude);

    // Create location entity
    const location = new GeoLocation({
      driverId,
      coordinates,
      accuracy,
      heading,
      speed,
      timestamp: new Date(),
    });

    // Save to Redis GEO index
    await this.geoLocationRepo.saveLocation(location);

    // Update driver availability with new location
    const availability = await this.availabilityRepo.findByDriverId(driverId);
    if (availability) {
      availability.updateLocation(location);
      await this.availabilityRepo.upsert(availability);
    }

    return {
      success: true,
      message: `Location updated for driver ${driverId}`,
    };
  }
}
