import { v4 as uuidv4 } from 'uuid';
import { Result, ok, err } from 'neverthrow';
import { UUID, Money } from '@going-monorepo-clean/shared-domain';

export type TransactionStatus = 'pending' | 'succeeded' | 'failed';

export interface TransactionProps {
  id: UUID;
  userId: UUID;
  referenceId: UUID; // ej. tripId, bookingId
  paymentIntentId?: string;
  amount: Money;
  status: TransactionStatus;
  createdAt: Date;
}

export class Transaction {
  readonly id: UUID;
  readonly userId: UUID;
  readonly referenceId: UUID;
  readonly paymentIntentId?: string;
  readonly amount: Money;
  readonly status: TransactionStatus;
  readonly createdAt: Date;

  private constructor(props: TransactionProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.referenceId = props.referenceId;
    this.paymentIntentId = props.paymentIntentId;
    this.amount = props.amount;
    this.status = props.status;
    this.createdAt = props.createdAt;
  }

  public static create(props: {
    userId: UUID;
    referenceId: UUID;
    amount: Money;
  }): Result<Transaction, Error> {
    if (!props.amount.isPositive()) {
      return err(new Error('Amount must be positive'));
    }

    const transaction = new Transaction({
      id: uuidv4(),
      ...props,
      status: 'pending',
      createdAt: new Date(),
    });
    return ok(transaction);
  }

  public toPrimitives(): any {
    return {
      id: this.id,
      userId: this.userId,
      referenceId: this.referenceId,
      paymentIntentId: this.paymentIntentId,
      amount: this.amount.toPrimitives(),
      status: this.status,
      createdAt: this.createdAt,
    };
  }

  public static fromPrimitives(props: any): Transaction {
    return new Transaction({
      ...props,
      amount: Money.fromPrimitives(props.amount),
    });
  }

  public setPaymentIntent(paymentIntentId: string): void {
    (this as any).paymentIntentId = paymentIntentId;
  }

  public succeed(): void {
    if (this.status === 'pending') {
      (this as any).status = 'succeeded';
    }
  }

  public fail(): void {
    if (this.status === 'pending') {
      (this as any).status = 'failed';
    }
  }
}