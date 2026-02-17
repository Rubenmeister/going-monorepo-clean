import { Inject, Injectable, Logger, BadRequestException } from '@nestjs/common';
import {
  Location,
  Geofence,
  ITrackingGateway,
} from '@going-monorepo-clean/domains-tracking-core';
import { IEventBus, UUID } from '@going-monorepo-clean/shared-domain';
import {
  DriverApproachingDestinationEvent,
  DriverArrivedAtPickupEvent,
} from '../events/tracking-domain.events';

const APPROACHING_THRESHOLD_KM = 1.0; // 1 km
const ARRIVAL_THRESHOLD_KM = 0.15; // 150 meters

export interface CheckProximityInput {
  driverId: UUID;
  tripId: UUID;
  driverLatitude: number;
  driverLongitude: number;
  destinationLatitude: number;
  destinationLongitude: number;
  type: 'pickup' | 'dropoff';
}

export interface CheckProximityResult {
  distanceKm: number;
  isApproaching: boolean;
  hasArrived: boolean;
  etaMinutes: number;
}

@Injectable()
export class CheckProximityUseCase {
  private readonly logger = new Logger(CheckProximityUseCase.name);

  constructor(
    @Inject(ITrackingGateway)
    private readonly trackingGateway: ITrackingGateway,
    @Inject(IEventBus)
    private readonly eventBus: IEventBus,
  ) {}

  async execute(input: CheckProximityInput): Promise<CheckProximityResult> {
    const driverLocResult = Location.create({
      latitude: input.driverLatitude,
      longitude: input.driverLongitude,
    });
    if (driverLocResult.isErr()) {
      throw new BadRequestException(driverLocResult.error.message);
    }

    const distanceKm = Geofence.haversineKm(
      input.driverLatitude,
      input.driverLongitude,
      input.destinationLatitude,
      input.destinationLongitude,
    );

    const etaMinutes = Math.round((distanceKm / 30) * 60 * 10) / 10;
    const isApproaching = distanceKm <= APPROACHING_THRESHOLD_KM;
    const hasArrived = distanceKm <= ARRIVAL_THRESHOLD_KM;

    // Emit domain events
    if (isApproaching && !hasArrived) {
      const event = new DriverApproachingDestinationEvent({
        driverId: input.driverId,
        tripId: input.tripId,
        distanceKm,
        etaMinutes,
        latitude: input.driverLatitude,
        longitude: input.driverLongitude,
      });
      await this.eventBus.publish(event);

      // Broadcast to trip room
      await this.trackingGateway.broadcastToRoom(
        `trip:${input.tripId}`,
        'driverApproaching',
        { driverId: input.driverId, distanceKm, etaMinutes },
      );
    }

    if (hasArrived && input.type === 'pickup') {
      const event = new DriverArrivedAtPickupEvent({
        driverId: input.driverId,
        tripId: input.tripId,
        latitude: input.driverLatitude,
        longitude: input.driverLongitude,
      });
      await this.eventBus.publish(event);

      await this.trackingGateway.broadcastToRoom(
        `trip:${input.tripId}`,
        'driverArrived',
        { driverId: input.driverId, type: 'pickup' },
      );
    }

    return { distanceKm, isApproaching, hasArrived, etaMinutes };
  }
}
