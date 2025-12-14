import { UUID, Money } from '@going-monorepo-clean/shared-domain';

export type RefundStatus = 'PENDING' | 'CONFIRMED' | 'FAILED' | 'CANCELLED';

export interface RefundProps {
  id: string;
  transactionId: string;
  amount: number;
  currency: string;
  status: RefundStatus;
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Refund {
  readonly id: string;
  readonly transactionId: string;
  amount: number;
  currency: string;
  status: RefundStatus;
  reason?: string;
  readonly createdAt: Date;
  updatedAt: Date;

  private constructor(props: RefundProps) {
    this.id = props.id;
    this.transactionId = props.transactionId;
    this.amount = props.amount;
    this.currency = props.currency;
    this.status = props.status;
    this.reason = props.reason;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public static create(props: {
    transactionId: string;
    amount: number;
    currency: string;
    reason?: string;
  }): Refund {
    return new Refund({
      id: crypto.randomUUID(),
      ...props,
      status: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  public static fromPrimitives(props: RefundProps): Refund {
    return new Refund(props);
  }

  public toPrimitives(): RefundProps {
    return {
      id: this.id,
      transactionId: this.transactionId,
      amount: this.amount,
      currency: this.currency,
      status: this.status,
      reason: this.reason,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  confirm(): void {
    if (this.status !== 'PENDING') {
      throw new Error('Only pending refunds can be confirmed.');
    }
    this.status = 'CONFIRMED';
    this.updatedAt = new Date();
  }

  fail(): void {
    if (this.status !== 'PENDING') {
      throw new Error('Only pending refunds can fail.');
    }
    this.status = 'FAILED';
    this.updatedAt = new Date();
  }

  cancel(): void {
    if (this.status !== 'PENDING') {
      throw new Error('Only pending refunds can be cancelled.');
    }
    this.status = 'CANCELLED';
    this.updatedAt = new Date();
  }
}