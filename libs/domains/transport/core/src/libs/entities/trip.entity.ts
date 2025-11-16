import { v4 as uuidv4 } from 'uuid';
import { Result, ok, err } from 'neverthrow';
import { Money, UUID, Location } from '@going-monorepo-clean/shared-domain'; // Reemplaza con tu scope

export type TripStatus =
  | 'pending' // Buscando conductor
  | 'driver_assigned'
  | 'in_progress' // Viaje en curso
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
  startedAt?: Date;
  completedAt?: Date;
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
  readonly startedAt?: Date;
  readonly completedAt?: Date;

  private constructor(props: TripProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.driverId = props.driverId;
    this.origin = props.origin;
    this.destination = props.destination;
    this.price = props.price;
    this.status = props.status;
    this.createdAt = props.createdAt;
    this.startedAt = props.startedAt;
    this.completedAt = props.completedAt;
  }

  // "Factory method" para crear un nuevo viaje
  public static create(props: {
    userId: UUID;
    origin: Location;
    destination: Location;
    price: Money;
  }): Result<Trip, Error> {
    
    if (!props.price.isPositive()) {
      return err(new Error('Price must be positive'));
    }

    const trip = new Trip({
      id: uuidv4(),
      ...props,
      status: 'pending',
      createdAt: new Date(),
    });

    return ok(trip);
  }

  // --- Métodos de Persistencia ---
  
  public toPrimitives(): any {
    return {
      id: this.id,
      userId: this.userId,
      driverId: this.driverId,
      origin: this.origin.toPrimitives(),
      destination: this.destination.toPrimitives(),
      price: this.price.toPrimitives(),
      status: this.status,
      createdAt: this.createdAt,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
    };
  }

  public static fromPrimitives(props: any): Trip {
    return new Trip({
      ...props,
      origin: Location.fromPrimitives(props.origin),
      destination: Location.fromPrimitives(props.destination),
      price: Money.fromPrimitives(props.price),
    });
  }

  // --- Lógica de Negocio ---
  
  public assignDriver(driverId: UUID): Result<void, Error> {
    if (this.status !== 'pending') {
      return err(new Error('Trip is not pending assignment'));
    }
    (this as any).driverId = driverId;
    (this as any).status = 'driver_assigned';
    return ok(undefined);
  }
  
  public startTrip(): Result<void, Error> {
    if (this.status !== 'driver_assigned') {
      return err(new Error('Driver must be assigned to start the trip'));
    }
    (this as any).status = 'in_progress';
    (this as any).startedAt = new Date();
    return ok(undefined);
  }
  
  public completeTrip(): Result<void, Error> {
    if (this.status !== 'in_progress') {
      return err(new Error('Trip is not in progress'));
    }
    (this as any).status = 'completed';
    (this as any).completedAt = new Date();
    return ok(undefined);
  }

  public cancel(): Result<void, Error> {
    if (this.status === 'completed' || this.status === 'cancelled') {
      return err(new Error('Cannot cancel a completed or already cancelled trip'));
    }
    (this as any).status = 'cancelled';
    return ok(undefined);
  }
}