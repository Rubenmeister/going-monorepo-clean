import { Result } from 'neverthrow';
import { Money } from '@going-monorepo-clean/shared-domain';

export const IPaymentGateway = Symbol('IPaymentGateway');

export interface PaymentIntentResult {
  clientSecret: string;
  paymentIntentId: string;
}

/**
 * Opciones del intent. `reference` es la referencia del comercio
 * (merchantTransactionId en Datafast / orderId en DeUna) que permite
 * correlacionar el pago con nuestro registro en el webhook y al consultar
 * estado. Opcional: los gateways que no la usen siguen funcionando igual.
 */
export interface PaymentIntentOptions {
  reference?: string;
  metadata?: Record<string, string>;
}

export interface IPaymentGateway {
  createPaymentIntent(amount: Money, options?: PaymentIntentOptions): Promise<Result<PaymentIntentResult, Error>>;
  constructWebhookEvent(payload: Buffer, signature: string): Promise<Result<any, Error>>;
}