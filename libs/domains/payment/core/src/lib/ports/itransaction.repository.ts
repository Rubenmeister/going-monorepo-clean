import { Result } from 'neverthrow';
import { Transaction } from '../entities/transaction.entity';
import { UUID } from '@going-monorepo-clean/shared-domain';

export const ITransactionRepository = Symbol('ITransactionRepository');

export interface ITransactionRepository {
  save(transaction: Transaction): Promise<Result<void, Error>>;
  update(transaction: Transaction): Promise<Result<void, Error>>;
  findById(id: UUID): Promise<Result<Transaction | null, Error>>;
  findByPaymentIntentId(paymentIntentId: string): Promise<Result<Transaction | null, Error>>;
}