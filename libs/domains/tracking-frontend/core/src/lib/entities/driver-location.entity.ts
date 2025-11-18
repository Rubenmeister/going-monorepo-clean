import { UUID, Location } from '@going-monorepo-clean/shared-domain'; // Reemplaza con tu scope

export interface DriverLocationProps {
  driverId: UUID;
  location: Location;
  updatedAt: Date;
}

export class DriverLocation {
  readonly driverId: UUID;
  readonly location: Location;
  readonly updatedAt: Date;

  constructor(props: DriverLocationProps) {
    this.driverId = props.driverId;
    this.location = props.location;
    this.updatedAt = props.updatedAt;
  }

  public static fromPrimitives(props: any): DriverLocation {
    return new DriverLocation({
      ...props,
      location: Location.fromPrimitives(props.location),
    });
  }
}