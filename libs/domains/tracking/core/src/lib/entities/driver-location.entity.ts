import { UUID } from '@going-monorepo-clean/shared-domain'; // Reemplaza con tu scope
import { Location } from '../value-objects/location.vo';

export interface DriverLocationProps {
  driverId: UUID;
  location: Location;
  updatedAt: Date;
}

export class DriverLocation {
  readonly driverId: UUID;
  readonly location: Location;
  readonly updatedAt: Date;

  private constructor(props: DriverLocationProps) {
    this.driverId = props.driverId;
    this.location = props.location;
    this.updatedAt = props.updatedAt;
  }

  // "Factory method" para crear o actualizar una ubicación
  public static create(props: {
    driverId: UUID;
    location: Location;
  }): DriverLocation {
    return new DriverLocation({
      ...props,
      updatedAt: new Date(),
    });
  }

  // --- Métodos de Persistencia ---
  
  public toPrimitives(): any {
    return {
      driverId: this.driverId,
      location: this.location.toPrimitives(),
      updatedAt: this.updatedAt,
    };
  }

  public static fromPrimitives(props: any): DriverLocation {
    return new DriverLocation({
      ...props,
      location: Location.fromPrimitives(props.location),
    });
  }
}