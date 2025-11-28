import { MoneyVO } from '@myorg/shared/domain/money.vo';
import { UUIDVO } from '@myorg/shared/domain/uuid.vo';
import { UserId } from '@myorg/domains/user/core'; // Asumiendo que ya existe
import { TripId } from '@myorg/domains/transport/core'; // Asumiendo que ya existe

export type TransactionStatus = 'PENDING' | 'CONFIRMED' | 'FAILED' | 'CANCELLED' | 'REFUNDED';

export class Transaction {
  id: UUIDVO;
  userId: UserId; // El que paga
  tripId?: TripId; // Opcional: si es pago de viaje
  amount: MoneyVO;
  status: TransactionStatus;
  paymentIntentId?: string; // ID de Stripe o proveedor
  createdAt: Date;
  updatedAt: Date;

  constructor(props: {
    id: UUIDVO;
    userId: UserId;
    amount: MoneyVO;
    tripId?: TripId;
  }) {
    this.id = props.id;
    this.userId = props.userId;
    this.amount = props.amount;
    this.tripId = props.tripId;
    this.status = 'PENDING';
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  confirm(paymentIntentId: string): void {
    if (this.status !== 'PENDING') {
      throw new Error('Solo transacciones pendientes pueden confirmarse.');
    }
    this.status = 'CONFIRMED';
    this.paymentIntentId = paymentIntentId;
    this.updatedAt = new Date();
  }

  fail(): void {
    if (this.status !== 'PENDING') {
      throw new Error('Solo transacciones pendientes pueden fallar.');
    }
    this.status = 'FAILED';
    this.updatedAt = new Date();
  }

  cancel(): void {
    if (this.status !== 'PENDING') {
      throw new Error('Solo transacciones pendientes pueden cancelarse.');
    }
    this.status = 'CANCELLED';
    this.updatedAt = new Date();
  }
}