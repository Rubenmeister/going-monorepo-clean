import { Result, ok, err } from 'neverthrow';

export interface DriverLocationProps {
  driverId: string;
  latitude: number;
  longitude: number;
  timestamp: Date;
}

export class DriverLocation {
  readonly driverId: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly timestamp: Date;

  private constructor(props: DriverLocationProps) {
    this.driverId = props.driverId;
    this.latitude = props.latitude;
    this.longitude = props.longitude;
    this.timestamp = props.timestamp;
  }

  public static create(props: {
    driverId: string;
    latitude: number;
    longitude: number;
  }): Result<DriverLocation, Error> {
    if (!props.driverId) return err(new Error('Driver ID is required'));
    if (props.latitude < -90 || props.latitude > 90)
      return err(new Error('Invalid latitude'));
    if (props.longitude < -180 || props.longitude > 180)
      return err(new Error('Invalid longitude'));

    return ok(
      new DriverLocation({
        driverId: props.driverId,
        latitude: props.latitude,
        longitude: props.longitude,
        timestamp: new Date(),
      })
    );
  }

  public toPrimitives(): any {
    return {
      driverId: this.driverId,
      latitude: this.latitude,
      longitude: this.longitude,
      timestamp: this.timestamp.toISOString(),
    };
  }

  public static fromPrimitives(props: any): DriverLocation {
    return new DriverLocation({
      driverId: props.driverId,
      latitude: Number(props.latitude),
      longitude: Number(props.longitude),
      timestamp: new Date(props.timestamp),
    });
  }
}
