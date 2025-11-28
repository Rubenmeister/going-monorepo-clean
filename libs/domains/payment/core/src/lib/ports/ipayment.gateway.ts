import { Transaction } from '../entities/transaction.entity';
import { PaymentMethodVO } from '../value-objects/payment-method.vo';

export interface IPaymentGateway {
  createPaymentIntent(amount: number, currency: string, paymentMethod: PaymentMethodVO): Promise<{ id: string; client_secret: string }>;
  confirmPaymentIntent(paymentIntentId: string): Promise<boolean>;
  cancelPaymentIntent(paymentIntentId: string): Promise<boolean>;
  refundPaymentIntent(paymentIntentId: string, amount?: number): Promise<boolean>;
}