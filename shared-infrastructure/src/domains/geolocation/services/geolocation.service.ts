import { GeoLocation, DriverAvailability } from '../entities';
import { Coordinates, Distance } from '../value-objects';
import { IGeoLocationRepository, IDriverAvailabilityRepository } from '../repositories';
import { DistanceCalculatorService } from './distance-calculator.service';

/**
 * GeolocationService
 * Domain service for geolocation operations
 */
export class GeolocationService {
  constructor(
    private geoLocationRepo: IGeoLocationRepository,
    private driverAvailabilityRepo: IDriverAvailabilityRepository,
    private distanceCalculator: DistanceCalculatorService
  ) {}

  /**
   * Find available drivers within a radius of a location
   */
  async findNearbyAvailableDrivers(
    latitude: number,
    longitude: number,
    radius: Distance,
    limit?: number
  ): Promise<DriverAvailability[]> {
    const nearbyLocations = await this.geoLocationRepo.findDriversNearby(
      latitude,
      longitude,
      radius,
      limit
    );

    const drivers: DriverAvailability[] = [];
    for (const location of nearbyLocations) {
      const availability = await this.driverAvailabilityRepo.findByDriverId(
        location.driverId
      );
      if (availability && availability.isAvailable()) {
        drivers.push(availability);
      }
    }

    return drivers.sort((a, b) => {
      const distA = this.distanceCalculator.calculateDistance(
        new Coordinates(latitude, longitude),
        a.currentLocation.coordinates
      );
      const distB = this.distanceCalculator.calculateDistance(
        new Coordinates(latitude, longitude),
        b.currentLocation.coordinates
      );
      return distA.kilometers - distB.kilometers;
    });
  }

  /**
   * Calculate ETA from driver to pickup location
   */
  estimateEta(
    driverLocation: GeoLocation,
    pickupLocation: Coordinates,
    averageSpeedKmh: number = 40
  ): number {
    const distance = this.distanceCalculator.calculateDistance(
      driverLocation.coordinates,
      pickupLocation
    );
    return this.distanceCalculator.estimateEta(distance, averageSpeedKmh);
  }

  /**
   * Calculate route distance using accumulated locations
   */
  calculateRouteDistance(locations: GeoLocation[]): Distance {
    if (locations.length < 2) {
      return new Distance(0);
    }

    let totalDistance = 0;
    for (let i = 0; i < locations.length - 1; i++) {
      const dist = this.distanceCalculator.calculateDistance(
        locations[i].coordinates,
        locations[i + 1].coordinates
      );
      totalDistance += dist.kilometers;
    }

    return new Distance(totalDistance);
  }

  /**
   * Find the closest available driver to a location
   */
  async findClosestAvailableDriver(
    latitude: number,
    longitude: number,
    searchRadius: Distance = new Distance(10)
  ): Promise<DriverAvailability | null> {
    const nearbyDrivers = await this.findNearbyAvailableDrivers(
      latitude,
      longitude,
      searchRadius,
      1
    );

    return nearbyDrivers.length > 0 ? nearbyDrivers[0] : null;
  }

  /**
   * Calculate distance between two drivers
   */
  async getDistanceBetweenDrivers(
    driverId1: string,
    driverId2: string
  ): Promise<Distance | null> {
    return this.geoLocationRepo.getDistance(driverId1, driverId2);
  }

  /**
   * Check if driver is within service area
   */
  async isDriverInServiceArea(
    driverId: string,
    serviceCenter: Coordinates,
    serviceRadius: Distance
  ): Promise<boolean> {
    const driverLocation = await this.geoLocationRepo.getDriverLocation(driverId);
    if (!driverLocation) {
      return false;
    }

    return this.distanceCalculator.isWithinRadius(
      driverLocation.coordinates,
      serviceCenter,
      serviceRadius
    );
  }

  /**
   * Calculate bearing from one location to another
   */
  calculateBearing(from: Coordinates, to: Coordinates): number {
    return this.distanceCalculator.calculateBearing(from, to);
  }
}
