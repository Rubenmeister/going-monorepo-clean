import { DomainEvent } from '@going-monorepo-clean/shared-domain';

export class BookingCreatedEvent implements DomainEvent {
  readonly eventName = 'booking.created';
  readonly occurredOn = new Date();

  constructor(
    readonly payload: {
      bookingId: string;
      userId: string;
      serviceId: string;
      serviceType: string;
      totalAmount: number;
      totalCurrency: string;
    },
  ) {}
}

export class BookingConfirmedEvent implements DomainEvent {
  readonly eventName = 'booking.confirmed';
  readonly occurredOn = new Date();

  constructor(
    readonly payload: {
      bookingId: string;
      userId: string;
    },
  ) {}
}

export class BookingCancelledEvent implements DomainEvent {
  readonly eventName = 'booking.cancelled';
  readonly occurredOn = new Date();

  constructor(
    readonly payload: {
      bookingId: string;
      userId: string;
      reason: string;
    },
  ) {}
}
