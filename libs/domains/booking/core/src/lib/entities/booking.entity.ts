import { v4 as uuidv4 } from 'uuid';
import { Result, ok, err } from 'neverthrow';
import { Money, UUID } from '@going-monorepo-clean/shared-domain';

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'completed';

export type ServiceType = 'transport' | 'accommodation' | 'tour' | 'experience' | 'parcel';

/** Quién paga / segmento de cliente. Distingue B2C de cuentas corporativas. */
export type ClientSegment = 'b2c' | 'corporate';

/** Cuándo se cobra. 'corporate_monthly' = factura consolidada a fin de mes. */
export type PaymentMode = 'immediate' | 'corporate_monthly';

export interface BookingProps {
  id: UUID;
  userId: UUID;
  serviceId: UUID;
  serviceType: ServiceType;
  bookingType?: 'urban' | 'intercity';
  totalPrice: Money;
  status: BookingStatus;
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
  /** Empresa corporativa dueña del booking. Sin valor → cliente B2C. */
  companyId?: UUID;
  /** Default 'b2c'. corporate-service lo setea a 'corporate' al crear. */
  clientSegment?: ClientSegment;
  /** Default 'immediate'. 'corporate_monthly' agrupa en la factura del mes. */
  paymentMode?: PaymentMode;
  /**
   * rideId disparado por BookingDispatcher para serviceType='transport' con
   * startDate futuro. Sin valor → el booking aún no fue convertido a ride
   * real. Marca idempotencia: si está set, no re-disparar (evita rides
   * duplicados si el cron corre 2 veces antes de persistir).
   */
  triggeredRideId?: UUID;
  /** Timestamp del dispatch (info para ops). */
  triggeredAt?: Date;
}

export class Booking {
  readonly id: UUID;
  readonly userId: UUID;
  readonly serviceId: UUID;
  readonly serviceType: ServiceType;
  readonly bookingType?: 'urban' | 'intercity';
  readonly totalPrice: Money;
  readonly status: BookingStatus;
  readonly startDate: Date;
  readonly endDate?: Date;
  readonly createdAt: Date;
  readonly companyId?: UUID;
  readonly clientSegment?: ClientSegment;
  readonly paymentMode?: PaymentMode;
  readonly triggeredRideId?: UUID;
  readonly triggeredAt?: Date;

  private constructor(props: BookingProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.serviceId = props.serviceId;
    this.serviceType = props.serviceType;
    this.bookingType = props.bookingType;
    this.totalPrice = props.totalPrice;
    this.status = props.status;
    this.startDate = props.startDate;
    this.endDate = props.endDate;
    this.createdAt = props.createdAt;
    this.companyId = props.companyId;
    this.clientSegment = props.clientSegment;
    this.paymentMode = props.paymentMode;
    this.triggeredRideId = props.triggeredRideId;
    this.triggeredAt = props.triggeredAt;
  }

  // Factory method to create a new booking
  public static create(props: {
    userId: UUID;
    serviceId: UUID;
    serviceType: ServiceType;
    bookingType?: 'urban' | 'intercity';
    totalPrice: Money;
    startDate: Date;
    endDate?: Date;
    companyId?: UUID;
    clientSegment?: ClientSegment;
    paymentMode?: PaymentMode;
  }): Result<Booking, Error> {
    if (!props.totalPrice.isPositive()) {
      return err(new Error('Total price must be positive'));
    }
    if (props.endDate && props.endDate <= props.startDate) {
      return err(new Error('End date must be after start date'));
    }

    const booking = new Booking({
      id: uuidv4(),
      ...props,
      status: 'pending',
      createdAt: new Date(),
    });

    return ok(booking);
  }

  // Persistence methods
  public toPrimitives(): any {
    return {
      id: this.id,
      userId: this.userId,
      serviceId: this.serviceId,
      serviceType: this.serviceType,
      bookingType: this.bookingType,
      totalPrice: this.totalPrice.toPrimitives(),
      status: this.status,
      startDate: this.startDate.toISOString(),
      endDate: this.endDate?.toISOString(),
      createdAt: this.createdAt.toISOString(),
      companyId: this.companyId,
      clientSegment: this.clientSegment,
      paymentMode: this.paymentMode,
      triggeredRideId: this.triggeredRideId,
      triggeredAt: this.triggeredAt?.toISOString(),
    };
  }

  public static fromPrimitives(props: any): Booking {
    return new Booking({
      ...props,
      totalPrice: Money.fromPrimitives(props.totalPrice),
      startDate: new Date(props.startDate),
      endDate: props.endDate ? new Date(props.endDate) : undefined,
      createdAt: new Date(props.createdAt),
      triggeredAt: props.triggeredAt ? new Date(props.triggeredAt) : undefined,
    });
  }

  /**
   * Marca el booking como ride-disparado. Usado por BookingDispatcher
   * (cron en booking-service) cuando convierte un scheduled corporate
   * booking en un ride real vía transport-service.
   *
   * Idempotente: si ya tiene rideId, retorna error (no re-disparar).
   */
  public markRideTriggered(rideId: UUID): Result<void, Error> {
    if (this.triggeredRideId) {
      return err(new Error(`Booking ${this.id} ya tiene ride ${this.triggeredRideId} disparado`));
    }
    if (this.status === 'cancelled' || this.status === 'completed') {
      return err(new Error(`No se puede disparar ride para booking ${this.status}`));
    }
    (this as any).triggeredRideId = rideId;
    (this as any).triggeredAt = new Date();
    // Auto-confirma si estaba pending
    if (this.status === 'pending') (this as any).status = 'confirmed';
    return ok(undefined);
  }

  // Business logic methods
  public confirm(): Result<void, Error> {
    if (this.status !== 'pending') {
      return err(new Error('Only pending bookings can be confirmed'));
    }
    (this as any).status = 'confirmed';
    return ok(undefined);
  }

  public cancel(): Result<void, Error> {
    if (this.status === 'completed' || this.status === 'cancelled') {
      return err(new Error(`Cannot cancel a ${this.status} booking`));
    }
    (this as any).status = 'cancelled';
    return ok(undefined);
  }

  public complete(): Result<void, Error> {
    if (this.status !== 'confirmed') {
      return err(new Error('Only confirmed bookings can be completed'));
    }
    (this as any).status = 'completed';
    return ok(undefined);
  }
}
