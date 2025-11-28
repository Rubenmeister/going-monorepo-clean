import { MoneyVO } from '@myorg/shared/domain/money.vo';
import { UUIDVO } from '@myorg/shared/domain/uuid.vo';
import { Transaction } from './transaction.entity';

export type RefundStatus = 'PENDING' | 'CONFIRMED' | 'FAILED' | 'CANCELLED';

export class Refund {
  id: UUIDVO;
  transactionId: string; // ID de la transacción original
  amount: MoneyVO;
  status: RefundStatus;
  reason?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: {
    id: UUIDVO;
    transactionId: string;
    amount: MoneyVO;
    reason?: string;
  }) {
    this.id = props.id;
    this.transactionId = props.transactionId;
    this.amount = props.amount;
    this.reason = props.reason;
    this.status = 'PENDING';
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  confirm(): void {
    if (this.status !== 'PENDING') {
      throw new Error('Solo reembolsos pendientes pueden confirmarse.');
    }
    this.status = 'CONFIRMED';
    this.updatedAt = new Date();
  }

  fail(): void {
    if (this.status !== 'PENDING') {
      throw new Error('Solo reembolsos pendientes pueden fallar.');
    }
    this.status = 'FAILED';
    this.updatedAt = new Date();
  }
}