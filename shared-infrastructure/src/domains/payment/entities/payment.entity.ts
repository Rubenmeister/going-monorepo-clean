/**
 * Payment Entity (Phase 8)
 * Represents a payment transaction for a completed ride
 */
export class Payment {
  id: string;
  tripId: string;
  passengerId: string;
  driverId: string;

  amount: number; // Total fare
  platformFee: number; // 20% commission
  driverAmount: number; // 80% to driver
  currency: string = 'USD';

  paymentMethod: 'card' | 'wallet' | 'cash';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  transactionId?: string; // Stripe transaction ID

  serviceCharge: number = 0;
  tax: number = 0;

  createdAt: Date;
  completedAt?: Date;
  failureReason?: string;

  metadata?: Record<string, any>;

  constructor(props: {
    id: string;
    tripId: string;
    passengerId: string;
    driverId: string;
    amount: number;
    platformFee?: number;
    driverAmount?: number;
    paymentMethod: 'card' | 'wallet' | 'cash';
    status?: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
    transactionId?: string;
    serviceCharge?: number;
    tax?: number;
    createdAt?: Date;
    completedAt?: Date;
    failureReason?: string;
    metadata?: Record<string, any>;
  }) {
    this.id = props.id;
    this.tripId = props.tripId;
    this.passengerId = props.passengerId;
    this.driverId = props.driverId;
    this.amount = props.amount;
    this.platformFee = props.platformFee || Math.round(props.amount * 0.2 * 100) / 100;
    this.driverAmount = props.driverAmount || Math.round(props.amount * 0.8 * 100) / 100;
    this.paymentMethod = props.paymentMethod;
    this.status = props.status || 'pending';
    this.transactionId = props.transactionId;
    this.serviceCharge = props.serviceCharge || 0;
    this.tax = props.tax || 0;
    this.createdAt = props.createdAt || new Date();
    this.completedAt = props.completedAt;
    this.failureReason = props.failureReason;
    this.metadata = props.metadata || {};
  }

  markAsProcessing(): void {
    this.status = 'processing';
  }

  markAsCompleted(transactionId: string): void {
    this.status = 'completed';
    this.transactionId = transactionId;
    this.completedAt = new Date();
  }

  markAsFailed(reason: string): void {
    this.status = 'failed';
    this.failureReason = reason;
  }

  markAsRefunded(): void {
    this.status = 'refunded';
  }

  isCompleted(): boolean {
    return this.status === 'completed';
  }

  isFailed(): boolean {
    return this.status === 'failed';
  }

  getTotalAmount(): number {
    return this.amount + this.serviceCharge + this.tax;
  }

  toObject() {
    return {
      id: this.id,
      tripId: this.tripId,
      passengerId: this.passengerId,
      driverId: this.driverId,
      amount: Math.round(this.amount * 100) / 100,
      platformFee: Math.round(this.platformFee * 100) / 100,
      driverAmount: Math.round(this.driverAmount * 100) / 100,
      currency: this.currency,
      paymentMethod: this.paymentMethod,
      status: this.status,
      transactionId: this.transactionId,
      serviceCharge: Math.round(this.serviceCharge * 100) / 100,
      tax: Math.round(this.tax * 100) / 100,
      totalAmount: Math.round(this.getTotalAmount() * 100) / 100,
      createdAt: this.createdAt,
      completedAt: this.completedAt,
      failureReason: this.failureReason,
      metadata: this.metadata,
    };
  }
}
