import { Injectable, Inject } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  TrackingSession,
  GeoLocation,
  Coordinates,
  ITrackingSessionRepository,
} from '@going/shared-infrastructure';

/**
 * Create Tracking Session Use Case
 * Initializes a new tracking session for a trip
 */
@Injectable()
export class CreateTrackingSessionUseCase {
  constructor(
    @Inject('ITrackingSessionRepository')
    private readonly trackingSessionRepo: ITrackingSessionRepository
  ) {}

  async execute(input: {
    tripId: string;
    driverId: string;
    userId: string;
    startLatitude: number;
    startLongitude: number;
    endLatitude: number;
    endLongitude: number;
  }): Promise<any> {
    const {
      tripId,
      driverId,
      userId,
      startLatitude,
      startLongitude,
      endLatitude,
      endLongitude,
    } = input;

    // Validate coordinates
    const startCoordinates = new Coordinates(startLatitude, startLongitude);
    const endCoordinates = new Coordinates(endLatitude, endLongitude);

    // Create start location entity
    const startLocation = new GeoLocation({
      driverId,
      coordinates: startCoordinates,
      accuracy: 0,
      timestamp: new Date(),
    });

    // Create session entity
    const session = new TrackingSession({
      id: uuidv4(),
      tripId,
      driverId,
      userId,
      startLocation,
      route: [startLocation],
      status: 'active',
    });

    // Persist to MongoDB
    const createdSession = await this.trackingSessionRepo.create(session);

    return {
      id: createdSession.id,
      tripId: createdSession.tripId,
      driverId: createdSession.driverId,
      userId: createdSession.userId,
      status: createdSession.status,
      startLocation: {
        latitude: createdSession.startLocation.coordinates.latitude,
        longitude: createdSession.startLocation.coordinates.longitude,
      },
      createdAt: createdSession.createdAt,
    };
  }
}
