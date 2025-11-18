import { Result } from 'neverthrow';
import { PaymentIntent } from '../entities/payment-intent.entity';
import { UUID, Money } from '@going-monorepo-clean/shared-domain';

// DTO para la solicitud de pago
export interface PaymentRequestData {
  userId: UUID;
  referenceId: UUID;
  amount: Money;
}

// Symbol para inyección de dependencias
export const IPaymentGateway = Symbol('IPaymentGateway');

export interface IPaymentGateway {
  /**
   * Solicita la creación de un Payment Intent al API Gateway.
   * La llamada al backend ya incluye la lógica de guardar la transacción.
   */
  requestIntent(data: PaymentRequestData, token: string): Promise<Result<PaymentIntent, Error>>;
}