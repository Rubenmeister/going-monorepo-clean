import { Result } from 'neverthrow';
import { Money } from '@going-monorepo-clean/shared-domain';

export interface PaymentIntent {
  clientSecret: string;
  paymentIntentId: string;
  amount: { amount: number; currency: string };
}

export interface PaymentRequestData {
  userId: string;
  referenceId: string;
  amount: Money;
}

export const IPaymentGateway = Symbol('IPaymentGateway');

export interface IPaymentGateway {
  requestIntent(data: PaymentRequestData, token: string): Promise<Result<PaymentIntent, Error>>;
  confirmPayment(paymentIntentId: string, token: string): Promise<Result<void, Error>>;
}
