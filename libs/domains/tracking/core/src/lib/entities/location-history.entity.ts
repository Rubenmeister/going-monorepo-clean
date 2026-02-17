import { v4 as uuidv4 } from 'uuid';
import { UUID } from '@going-monorepo-clean/shared-domain';
import { Location } from '../value-objects/location.vo';

export interface LocationHistoryProps {
  id: UUID;
  driverId: UUID;
  tripId?: UUID;
  location: Location;
  speed?: number; // km/h
  heading?: number; // degrees 0-360
  accuracy?: number; // meters
  recordedAt: Date;
}

export class LocationHistory {
  readonly id: UUID;
  readonly driverId: UUID;
  readonly tripId?: UUID;
  readonly location: Location;
  readonly speed?: number;
  readonly heading?: number;
  readonly accuracy?: number;
  readonly recordedAt: Date;

  private constructor(props: LocationHistoryProps) {
    this.id = props.id;
    this.driverId = props.driverId;
    this.tripId = props.tripId;
    this.location = props.location;
    this.speed = props.speed;
    this.heading = props.heading;
    this.accuracy = props.accuracy;
    this.recordedAt = props.recordedAt;
  }

  public static create(props: Omit<LocationHistoryProps, 'id' | 'recordedAt'>): LocationHistory {
    return new LocationHistory({
      ...props,
      id: uuidv4(),
      recordedAt: new Date(),
    });
  }

  public toPrimitives(): Record<string, unknown> {
    return {
      id: this.id,
      driverId: this.driverId,
      tripId: this.tripId,
      location: this.location.toPrimitives(),
      speed: this.speed,
      heading: this.heading,
      accuracy: this.accuracy,
      recordedAt: this.recordedAt,
    };
  }

  public static fromPrimitives(props: Record<string, any>): LocationHistory {
    return new LocationHistory({
      ...props,
      location: Location.fromPrimitives(props.location),
    } as LocationHistoryProps);
  }
}
