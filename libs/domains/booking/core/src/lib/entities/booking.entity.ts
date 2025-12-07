import { Result, ok, err } from 'neverthrow';

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type BookingType = 'accommodation' | 'experience' | 'transport' | 'tour';

export interface BookingProps {
  id: string;
  userId: string;
  type: BookingType;
  accommodationId?: string;
  experienceId?: string;
  transportId?: string;
  tourId?: string;
  startDate: Date;
  endDate?: Date;
  guests: number;
  totalPrice: number;
  currency: string;
  status: BookingStatus;
  createdAt: Date;
  updatedAt: Date;
}

export class Booking {
  readonly id: string;
  readonly userId: string;
  readonly type: BookingType;
  readonly accommodationId?: string;
  readonly experienceId?: string;
  readonly transportId?: string;
  readonly tourId?: string;
  readonly startDate: Date;
  readonly endDate?: Date;
  readonly guests: number;
  readonly totalPrice: number;
  readonly currency: string;
  readonly status: BookingStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  private constructor(props: BookingProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.type = props.type;
    this.accommodationId = props.accommodationId;
    this.experienceId = props.experienceId;
    this.transportId = props.transportId;
    this.tourId = props.tourId;
    this.startDate = props.startDate;
    this.endDate = props.endDate;
    this.guests = props.guests;
    this.totalPrice = props.totalPrice;
    this.currency = props.currency;
    this.status = props.status;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  // Factory method para crear nueva reserva
  public static create(props: {
    userId: string;
    type: BookingType;
    accommodationId?: string;
    experienceId?: string;
    transportId?: string;
    tourId?: string;
    startDate: Date;
    endDate?: Date;
    guests: number;
    totalPrice: number;
    currency?: string;
  }): Result<Booking, Error> {
    // Validaciones de negocio
    if (!props.userId || props.userId.length === 0) {
      return err(new Error('userId is required'));
    }
    if (props.guests < 1) {
      return err(new Error('Guests must be at least 1'));
    }
    if (props.totalPrice < 0) {
      return err(new Error('Total price cannot be negative'));
    }
    if (props.startDate < new Date()) {
      return err(new Error('Start date cannot be in the past'));
    }
    if (props.endDate && props.endDate < props.startDate) {
      return err(new Error('End date cannot be before start date'));
    }

    // Validar que al menos un ID de recurso esté presente
    const hasResource = props.accommodationId || props.experienceId || props.transportId || props.tourId;
    if (!hasResource) {
      return err(new Error('At least one resource ID (accommodation, experience, transport, or tour) is required'));
    }

    const booking = new Booking({
      id: crypto.randomUUID(),
      ...props,
      currency: props.currency || 'USD',
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return ok(booking);
  }

  // Lógica de negocio: Confirmar reserva
  public confirm(): Result<Booking, Error> {
    if (this.status !== 'pending') {
      return err(new Error('Only pending bookings can be confirmed'));
    }

    return ok(
      new Booking({
        ...this,
        status: 'confirmed',
        updatedAt: new Date(),
      })
    );
  }

  // Lógica de negocio: Cancelar reserva
  public cancel(): Result<Booking, Error> {
    if (this.status === 'cancelled') {
      return err(new Error('Booking is already cancelled'));
    }
    if (this.status === 'completed') {
      return err(new Error('Cannot cancel a completed booking'));
    }

    return ok(
      new Booking({
        ...this,
        status: 'cancelled',
        updatedAt: new Date(),
      })
    );
  }

  // Lógica de negocio: Completar reserva
  public complete(): Result<Booking, Error> {
    if (this.status !== 'confirmed') {
      return err(new Error('Only confirmed bookings can be completed'));
    }

    return ok(
      new Booking({
        ...this,
        status: 'completed',
        updatedAt: new Date(),
      })
    );
  }

  // Serialización para persistencia
  public toPrimitives(): BookingProps {
    return {
      id: this.id,
      userId: this.userId,
      type: this.type,
      accommodationId: this.accommodationId,
      experienceId: this.experienceId,
      transportId: this.transportId,
      tourId: this.tourId,
      startDate: this.startDate,
      endDate: this.endDate,
      guests: this.guests,
      totalPrice: this.totalPrice,
      currency: this.currency,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  // Deserialización desde persistencia
  public static fromPrimitives(props: BookingProps): Booking {
    return new Booking(props);
  }
}