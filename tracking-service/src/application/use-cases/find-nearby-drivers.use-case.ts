import { Injectable, Inject } from '@nestjs/common';
import {
  GeolocationService,
  DistanceCalculatorService,
  Distance,
  IGeoLocationRepository,
  IDriverAvailabilityRepository,
} from '../../domain/ports';

/**
 * Find Nearby Drivers Use Case
 * Finds available drivers near a given location
 */
@Injectable()
export class FindNearbyDriversUseCase {
  constructor(
    @Inject('GeolocationService')
    private readonly geoService: GeolocationService,
    @Inject(DistanceCalculatorService)
    private readonly distanceCalculator: DistanceCalculatorService,
    @Inject('IGeoLocationRepository')
    private readonly geoLocationRepo: IGeoLocationRepository,
    @Inject('IDriverAvailabilityRepository')
    private readonly availabilityRepo: IDriverAvailabilityRepository
  ) {}

  async execute(input: {
    latitude: number;
    longitude: number;
    radius?: number;
    limit?: number;
    serviceType?: string;
  }): Promise<any> {
    const { latitude, longitude, radius = 5, limit = 10, serviceType } = input;

    const searchRadius = new Distance(radius);

    let drivers = await this.geoService.findNearbyAvailableDrivers(
      latitude,
      longitude,
      searchRadius,
      limit
    );

    // Filter by service type if provided
    if (serviceType) {
      drivers = drivers.filter((d) => d.serviceTypes.includes(serviceType));
    }

    // Enrich with distance and ETA
    return drivers.map((driver) => ({
      driverId: driver.driverId,
      latitude: driver.currentLocation.coordinates.latitude,
      longitude: driver.currentLocation.coordinates.longitude,
      distance: this.distanceCalculator.calculateDistance(
        { latitude, longitude } as any,
        driver.currentLocation.coordinates
      ).kilometers,
      eta: this.geoService.estimateEta(driver.currentLocation, {
        latitude,
        longitude,
      } as any),
      status: driver.status,
      availableSeats: driver.availableSeats,
      serviceTypes: driver.serviceTypes,
    }));
  }
}
