import { Injectable, Inject } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  Ride,
  Fare,
  GeoLocation,
  Coordinates,
  GeolocationService,
  Distance,
  IRideRepository,
} from '../../domain/ports';

/**
 * Request Ride Use Case
 */
@Injectable()
export class RequestRideUseCase {
  constructor(
    @Inject('IRideRepository')
    private readonly rideRepo: IRideRepository,
    @Inject('GeolocationService')
    private readonly geoService: GeolocationService
  ) {}

  async execute(input: {
    userId: string;
    pickupLatitude: number;
    pickupLongitude: number;
    dropoffLatitude: number;
    dropoffLongitude: number;
    serviceType?: string;
  }): Promise<any> {
    const {
      userId,
      pickupLatitude,
      pickupLongitude,
      dropoffLatitude,
      dropoffLongitude,
    } = input;

    // Create coordinates
    const pickupCoords = new Coordinates(pickupLatitude, pickupLongitude);
    const dropoffCoords = new Coordinates(dropoffLatitude, dropoffLongitude);

    // Create pickup location
    const pickupLocation = new GeoLocation({
      driverId: 'system',
      coordinates: pickupCoords,
      accuracy: 0,
      timestamp: new Date(),
    });

    // Estimate fare
    // For demo: 10km default distance
    const estimatedDistance = 10;
    const estimatedDuration = 15;
    const surge = this.calculateSurge();

    const fare = Fare.calculate(
      estimatedDistance,
      estimatedDuration,
      surge,
      2.5, // base fare
      0.5, // per km
      0.1 // per minute
    );

    // Create ride
    const ride = new Ride({
      id: uuidv4(),
      userId,
      pickupLocation,
      dropoffLocation: dropoffCoords,
      fare,
    });

    // Save to database
    const savedRide = await this.rideRepo.create(ride);

    // Calculate ETA to nearby drivers
    const eta = this.geoService.estimateEta(
      pickupLocation,
      pickupCoords,
      40 // average speed
    );

    return {
      rideId: savedRide.id,
      userId: savedRide.userId,
      status: savedRide.status,
      pickupLocation: {
        latitude: pickupLatitude,
        longitude: pickupLongitude,
      },
      dropoffLocation: {
        latitude: dropoffLatitude,
        longitude: dropoffLongitude,
      },
      fare: fare.toObject(),
      eta,
      requestedAt: savedRide.requestedAt,
    };
  }

  /**
   * Calculate surge pricing based on demand
   */
  private calculateSurge(): number {
    // Simple implementation - could be enhanced with real demand data
    const hour = new Date().getHours();

    // Peak hours: 8-9am, 5-7pm
    if ((hour >= 8 && hour <= 9) || (hour >= 17 && hour <= 19)) {
      return 1.5; // 50% surge
    }

    // Normal hours
    return 1.0;
  }
}
