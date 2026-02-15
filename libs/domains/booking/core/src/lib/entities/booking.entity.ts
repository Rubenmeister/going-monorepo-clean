import { v4 as uuidv4 } from 'uuid';
import { Result, ok, err } from 'neverthrow';
import { Money, UUID } from '@going-monorepo-clean/shared-domain';

export enum ServiceType {
  TRANSPORT = 'transport',
  ACCOMMODATION = 'accommodation',
  TOUR = 'tour',
  EXPERIENCE = 'experience',
}
export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export interface BookingProps {
  id: UUID;
  userId: UUID;
  serviceId: UUID;
  serviceType: ServiceType;
  totalPrice: Money;
  status: BookingStatus;
  createdAt: Date;
  startDate: Date;
  endDate?: Date;
}

export class Booking {
  readonly id: UUID;
  readonly userId: UUID;
  readonly serviceId: UUID;
  readonly serviceType: ServiceType;
  readonly totalPrice: Money;
  readonly status: BookingStatus;
  readonly createdAt: Date;
  readonly startDate: Date;
  readonly endDate?: Date;

  private constructor(props: BookingProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.serviceId = props.serviceId;
    this.serviceType = props.serviceType;
    this.totalPrice = props.totalPrice;
    this.status = props.status;
    this.createdAt = props.createdAt;
    this.startDate = props.startDate;
    this.endDate = props.endDate;
  }

  public static create(props: {
    userId: UUID;
    serviceId: UUID;
    serviceType: ServiceType;
    totalPrice: Money;
    startDate: Date;
    endDate?: Date;
  }): Result<Booking, Error> {
    if (!props.totalPrice.isPositive()) {
      return err(new Error('Total price must be positive'));
    }

    const booking = new Booking({
      id: uuidv4(),
      ...props,
      status: BookingStatus.PENDING,
      createdAt: new Date(),
    });

    return ok(booking);
  }

  // --- Métodos de Persistencia ---

  public toPrimitives(): any {
    return {
      id: this.id,
      userId: this.userId,
      serviceId: this.serviceId,
      serviceType: this.serviceType,
      totalPrice: this.totalPrice.toPrimitives(),
      status: this.status,
      createdAt: this.createdAt,
      startDate: this.startDate,
      endDate: this.endDate,
    };
  }

  public static fromPrimitives(props: any): Booking {
    return new Booking({
      ...props,
      totalPrice: Money.fromPrimitives(props.totalPrice),
    });
  }

  // --- Lógica de Negocio ---

  public confirm(): Result<void, Error> {
    if (this.status !== BookingStatus.PENDING) {
      return err(new Error('Only pending bookings can be confirmed'));
    }
    (this as any).status = BookingStatus.CONFIRMED;
    return ok(undefined);
  }

  public cancel(): Result<void, Error> {
    if (this.status === BookingStatus.COMPLETED || this.status === BookingStatus.CANCELLED) {
      return err(new Error('Cannot cancel a completed or already cancelled booking'));
    }
    (this as any).status = BookingStatus.CANCELLED;
    return ok(undefined);
  }

  public complete(): Result<void, Error> {
    if (this.status !== BookingStatus.CONFIRMED) {
      return err(new Error('Only confirmed bookings can be completed'));
    }
    (this as any).status = BookingStatus.COMPLETED;
    return ok(undefined);
  }
}
