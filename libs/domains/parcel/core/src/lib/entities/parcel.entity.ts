import { v4 as uuidv4 } from 'uuid';
import { Result, ok, err } from 'neverthrow';
import { Money, UUID, Location } from '@going-monorepo-clean/shared-domain'; // Reemplaza con tu scope

export type ParcelStatus =
  | 'pending'
  | 'pickup_assigned'
  | 'in_transit'
  | 'delivered'
  | 'cancelled';

export interface ParcelProps {
  id: UUID;
  userId: UUID;
  driverId?: UUID;
  origin: Location;
  destination: Location;
  description: string;
  price: Money;
  status: ParcelStatus;
  trackingCode: string;
  otpPin: string;
  createdAt: Date;
}

export class Parcel {
  readonly id: UUID;
  readonly userId: UUID;
  readonly driverId?: UUID;
  readonly origin: Location;
  readonly destination: Location;
  readonly description: string;
  readonly price: Money;
  readonly status: ParcelStatus;
  readonly trackingCode: string;
  readonly otpPin: string;
  readonly createdAt: Date;

  private constructor(props: ParcelProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.driverId = props.driverId;
    this.origin = props.origin;
    this.destination = props.destination;
    this.description = props.description;
    this.price = props.price;
    this.status = props.status;
    this.trackingCode = props.trackingCode;
    this.otpPin = props.otpPin;
    this.createdAt = props.createdAt;
  }

  // "Factory method" para crear un nuevo envío
  public static create(props: {
    userId: UUID;
    origin: Location;
    destination: Location;
    description: string;
    price: Money;
  }): Result<Parcel, Error> {

    if (props.description.length < 3) {
      return err(new Error('Description must be at least 3 characters'));
    }
    if (!props.price.isPositive()) {
      return err(new Error('Price must be positive'));
    }

    // Generate tracking code (6-char alphanumeric)
    const trackingCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    // Generate OTP PIN (4-digit)
    const otpPin = String(Math.floor(1000 + Math.random() * 9000));

    const parcel = new Parcel({
      id: uuidv4(),
      ...props,
      status: 'pending',
      trackingCode,
      otpPin,
      createdAt: new Date(),
    });

    return ok(parcel);
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
      trackingCode: this.trackingCode,
      otpPin: this.otpPin,
      createdAt: this.createdAt,
    };
  }

  public static fromPrimitives(props: any): Parcel {
    return new Parcel({
      ...props,
      origin: Location.fromPrimitives(props.origin),
      destination: Location.fromPrimitives(props.destination),
      price: Money.fromPrimitives(props.price),
    });
  }

  // --- Lógica de Negocio ---
  
  public assignDriver(driverId: UUID): Result<void, Error> {
    if (this.status !== 'pending') {
      return err(new Error('Parcel is not pending assignment'));
    }
    (this as any).driverId = driverId;
    (this as any).status = 'pickup_assigned';
    return ok(undefined);
  }
  
  public markAsInTransit(): Result<void, Error> {
    if (this.status !== 'pickup_assigned') {
      return err(new Error('Parcel must be assigned to a driver first'));
    }
    (this as any).status = 'in_transit';
    return ok(undefined);
  }
  
  public deliver(): Result<void, Error> {
    if (this.status !== 'in_transit') {
      return err(new Error('Parcel is not in transit'));
    }
    (this as any).status = 'delivered';
    return ok(undefined);
  }

  /**
   * Cancelar el envío cuando aún no hay conductor asignado o justo antes
   * del pickup. Prohibido una vez en tránsito o entregado.
   *
   * El `reason` opcional se anexa al description para dejar traza
   * (no requiere cambio de schema). Patrón: "[CANCEL:<reason>] <desc>".
   */
  public cancel(reason?: string): Result<void, Error> {
    if (this.status === 'in_transit' || this.status === 'delivered') {
      return err(
        new Error('Parcel cannot be cancelled after pickup or delivery'),
      );
    }
    if (this.status === 'cancelled') return ok(undefined); // idempotente
    (this as any).status = 'cancelled';
    if (reason && !this.description.startsWith('[CANCEL:')) {
      (this as any).description = `[CANCEL:${reason}] ${this.description}`;
    }
    return ok(undefined);
  }
}