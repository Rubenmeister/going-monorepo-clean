import { DomainEvent } from '@going-monorepo-clean/shared-domain';

export class PaymentSucceededEvent implements DomainEvent {
  readonly eventName = 'payment.succeeded';
  readonly occurredOn = new Date();

  constructor(
    readonly payload: {
      transactionId: string;
      referenceId: string;
      paymentIntentId: string;
    },
  ) {}
}

export class PaymentFailedEvent implements DomainEvent {
  readonly eventName = 'payment.failed';
  readonly occurredOn = new Date();

  constructor(
    readonly payload: {
      transactionId: string;
      referenceId: string;
      paymentIntentId: string;
    },
  ) {}
}
