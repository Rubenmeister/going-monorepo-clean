import { Result, ok, err } from 'neverthrow';
import { Money, UUID, Location } from '@going-monorepo-clean/shared-domain'; // Reemplaza con tu scope

// Estados del viaje que el frontend necesita conocer
export type TripStatus =
  | 'pending'
  | 'driver_assigned'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface TripProps {
  id: UUID;
  userId: UUID;
  driverId?: UUID;
  origin: Location;
  destination: Location;
  price: Money;
  status: TripStatus;
  createdAt: Date;
}

export class Trip {
  readonly id: UUID;
  readonly userId: UUID;
  readonly driverId?: UUID;
  readonly origin: Location;
  readonly destination: Location;
  readonly price: Money;
  readonly status: TripStatus;
  readonly createdAt: Date;

  constructor(props: TripProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.driverId = props.driverId;
    this.origin = props.origin;
    this.destination = props.destination;
    this.price = props.price;
    this.status = props.status;
    this.createdAt = props.createdAt;
  }

  // --- Métodos de Persistencia ---
  
  public toPrimitives(): TripProps {
    return {
      id: this.id,
      userId: this.userId,
      driverId: this.driverId,
      origin: this.origin.toPrimitives(),
      destination: this.destination.toPrimitives(),
      price: this.price.toPrimitives(),
      status: this.status,
      createdAt: this.createdAt,
    };
  }

  public static fromPrimitives(props: any): Trip {
    // Reconstruye los VOs anidados
    return new Trip({
      ...props,
      origin: Location.fromPrimitives(props.origin),
      destination: Location.fromPrimitives(props.destination),
      price: Money.fromPrimitives(props.price),
    });
  }
}