import { Injectable, Inject } from '@nestjs/common';
import {
  GeoLocation,
  Coordinates,
  ITrackingSessionRepository,
} from '../../domain/ports';

/**
 * Complete Tracking Session Use Case
 * Finalizes tracking for a completed trip
 */
@Injectable()
export class CompleteTrackingSessionUseCase {
  constructor(
    @Inject('ITrackingSessionRepository')
    private readonly trackingSessionRepo: ITrackingSessionRepository
  ) {}

  async execute(input: {
    tripId: string;
    endLatitude: number;
    endLongitude: number;
  }): Promise<any> {
    const { tripId, endLatitude, endLongitude } = input;

    // Find session by trip ID
    const session = await this.trackingSessionRepo.findByTripId(tripId);
    if (!session) {
      throw new Error(`Tracking session not found for trip ${tripId}`);
    }

    if (session.status !== 'active') {
      throw new Error(
        `Cannot complete non-active tracking session. Current status: ${session.status}`
      );
    }

    // Create end location entity
    const endCoordinates = new Coordinates(endLatitude, endLongitude);
    const endLocation = new GeoLocation({
      driverId: session.driverId,
      coordinates: endCoordinates,
      accuracy: 0,
      timestamp: new Date(),
    });

    // Complete session
    const completedSession = await this.trackingSessionRepo.complete(
      session.id,
      endCoordinates
    );

    return {
      id: completedSession.id,
      tripId: completedSession.tripId,
      driverId: completedSession.driverId,
      userId: completedSession.userId,
      status: completedSession.status,
      distance: completedSession.getDistance(),
      duration: completedSession.getDuration(),
      routePoints: completedSession.route.length,
      completedAt: completedSession.completedAt,
    };
  }
}
