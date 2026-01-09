import { Payment } from '../entities/payment.entity';
import { Result } from 'neverthrow';

export const IPaymentRepository = Symbol('IPaymentRepository');

export interface IPaymentRepository {
  save(payment: Payment): Promise<Result<void, Error>>;
  findById(id: string): Promise<Result<Payment | null, Error>>;
}
