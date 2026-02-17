import { DomainEvent } from '@going-monorepo-clean/shared-domain';

export class DriverEnteredGeofenceEvent implements DomainEvent {
  readonly eventName = 'tracking.driver.entered_geofence';
  readonly occurredOn: Date;

  constructor(
    readonly payload: {
      driverId: string;
      tripId?: string;
      geofenceLabel: string;
      latitude: number;
      longitude: number;
      distanceKm: number;
    },
  ) {
    this.occurredOn = new Date();
  }
}

export class DriverExitedGeofenceEvent implements DomainEvent {
  readonly eventName = 'tracking.driver.exited_geofence';
  readonly occurredOn: Date;

  constructor(
    readonly payload: {
      driverId: string;
      tripId?: string;
      geofenceLabel: string;
      latitude: number;
      longitude: number;
      distanceKm: number;
    },
  ) {
    this.occurredOn = new Date();
  }
}

export class DriverApproachingDestinationEvent implements DomainEvent {
  readonly eventName = 'tracking.driver.approaching_destination';
  readonly occurredOn: Date;

  constructor(
    readonly payload: {
      driverId: string;
      tripId: string;
      distanceKm: number;
      etaMinutes: number;
      latitude: number;
      longitude: number;
    },
  ) {
    this.occurredOn = new Date();
  }
}

export class DriverArrivedAtPickupEvent implements DomainEvent {
  readonly eventName = 'tracking.driver.arrived_at_pickup';
  readonly occurredOn: Date;

  constructor(
    readonly payload: {
      driverId: string;
      tripId: string;
      latitude: number;
      longitude: number;
    },
  ) {
    this.occurredOn = new Date();
  }
}
