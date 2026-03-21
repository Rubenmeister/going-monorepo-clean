/**
 * Payout Entity
 * Represents payout to driver from completed rides
 */
export class Payout {
  id: string;
  driverId: string;

  amount: number;
  currency: string = 'USD';

  status: 'pending' | 'processing' | 'completed' | 'failed';
  paymentMethod: 'bank_account' | 'debit_card' | 'wallet';

  periodStart: Date;
  periodEnd: Date;

  transactionCount: number;
  transactionIds: string[]; // Payment IDs included in this payout

  fees: number = 0;
  netAmount: number; // amount - fees

  createdAt: Date;
  processedAt?: Date;
  failureReason?: string;

  metadata?: Record<string, any>;

  constructor(props: {
    id: string;
    driverId: string;
    amount: number;
    currency?: string;
    status?: 'pending' | 'processing' | 'completed' | 'failed';
    paymentMethod: 'bank_account' | 'debit_card' | 'wallet';
    periodStart: Date;
    periodEnd: Date;
    transactionCount: number;
    transactionIds: string[];
    fees?: number;
    createdAt?: Date;
    processedAt?: Date;
    failureReason?: string;
    metadata?: Record<string, any>;
  }) {
    this.id = props.id;
    this.driverId = props.driverId;
    this.amount = props.amount;
    this.currency = props.currency || 'USD';
    this.status = props.status || 'pending';
    this.paymentMethod = props.paymentMethod;
    this.periodStart = props.periodStart;
    this.periodEnd = props.periodEnd;
    this.transactionCount = props.transactionCount;
    this.transactionIds = props.transactionIds;
    this.fees = props.fees || 0;
    this.netAmount = props.amount - this.fees;
    this.createdAt = props.createdAt || new Date();
    this.processedAt = props.processedAt;
    this.failureReason = props.failureReason;
    this.metadata = props.metadata || {};
  }

  markAsProcessing(): void {
    this.status = 'processing';
  }

  markAsCompleted(): void {
    this.status = 'completed';
    this.processedAt = new Date();
  }

  markAsFailed(reason: string): void {
    this.status = 'failed';
    this.failureReason = reason;
  }

  isCompleted(): boolean {
    return this.status === 'completed';
  }

  getPeriodLabel(): string {
    return `${this.periodStart.toLocaleDateString()} - ${this.periodEnd.toLocaleDateString()}`;
  }

  toObject() {
    return {
      id: this.id,
      driverId: this.driverId,
      amount: Math.round(this.amount * 100) / 100,
      currency: this.currency,
      status: this.status,
      paymentMethod: this.paymentMethod,
      periodStart: this.periodStart,
      periodEnd: this.periodEnd,
      periodLabel: this.getPeriodLabel(),
      transactionCount: this.transactionCount,
      transactionIds: this.transactionIds,
      fees: Math.round(this.fees * 100) / 100,
      netAmount: Math.round(this.netAmount * 100) / 100,
      createdAt: this.createdAt,
      processedAt: this.processedAt,
      failureReason: this.failureReason,
      metadata: this.metadata,
    };
  }
}
