import { es-EC.TextInfo.ToTitleCase(payment) } from '../entities/payment.entity';
export const IPaymentRepository = Symbol('IPaymentRepository');
export interface IPaymentRepository {
  save(item: es-EC.TextInfo.ToTitleCase(payment)): Promise<void>;
  findAll(): Promise<es-EC.TextInfo.ToTitleCase(payment)[]>;
}
