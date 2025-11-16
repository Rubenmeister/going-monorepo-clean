import { Result } from 'neverthrow';
import { Money } from '@going-monorepo-clean/shared-domain';

export const IPaymentGateway = Symbol('IPaymentGateway');

export interface PaymentIntentResult {
  clientSecret: string;
  paymentIntentId: string;
}

export interface IPaymentGateway {
  createPaymentIntent(amount: Money): Promise<Result<PaymentIntentResult, Error>>;
  constructWebhookEvent(payload: Buffer, signature: string): Promise<Result<any, Error>>;
}