import { UUID, Money } from '@going-monorepo-clean/shared-domain';

export type TransactionStatus = 'PENDING' | 'CONFIRMED' | 'FAILED' | 'CANCELLED' | 'REFUNDED';

export interface TransactionProps {
  id: string;
  userId: string;
  tripId?: string;
  bookingId?: string;
  parcelId?: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  paymentIntentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Transaction {
  readonly id: string;
  readonly userId: string;
  readonly tripId?: string;
  readonly bookingId?: string;
  readonly parcelId?: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  paymentIntentId?: string;
  readonly createdAt: Date;
  updatedAt: Date;

  private constructor(props: TransactionProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.tripId = props.tripId;
    this.bookingId = props.bookingId;
    this.parcelId = props.parcelId;
    this.amount = props.amount;
    this.currency = props.currency;
    this.status = props.status;
    this.paymentIntentId = props.paymentIntentId;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public static create(props: {
    userId: string;
    amount: number;
    currency: string;
    tripId?: string;
    bookingId?: string;
    parcelId?: string;
  }): Transaction {
    return new Transaction({
      id: crypto.randomUUID(),
      ...props,
      status: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  public static fromPrimitives(props: TransactionProps): Transaction {
    return new Transaction(props);
  }

  public toPrimitives(): TransactionProps {
    return {
      id: this.id,
      userId: this.userId,
      tripId: this.tripId,
      bookingId: this.bookingId,
      parcelId: this.parcelId,
      amount: this.amount,
      currency: this.currency,
      status: this.status,
      paymentIntentId: this.paymentIntentId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  confirm(paymentIntentId: string): void {
    if (this.status !== 'PENDING') {
      throw new Error('Only pending transactions can be confirmed.');
    }
    this.status = 'CONFIRMED';
    this.paymentIntentId = paymentIntentId;
    this.updatedAt = new Date();
  }

  fail(): void {
    if (this.status !== 'PENDING') {
      throw new Error('Only pending transactions can fail.');
    }
    this.status = 'FAILED';
    this.updatedAt = new Date();
  }

  cancel(): void {
    if (this.status !== 'PENDING') {
      throw new Error('Only pending transactions can be cancelled.');
    }
    this.status = 'CANCELLED';
    this.updatedAt = new Date();
  }

  refund(): void {
    if (this.status !== 'CONFIRMED') {
      throw new Error('Only confirmed transactions can be refunded.');
    }
    this.status = 'REFUNDED';
    this.updatedAt = new Date();
  }
}