import { UUID } from '@going-monorepo-clean/shared-domain';
import { Result, ok, err } from 'neverthrow';

// Estados de la transacción, cruciales para el dominio de pagos
export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'refunded';

// El Puerto para interactuar con la pasarela de pago externa
// Lo definimos aquí para que la entidad pueda usarlo en sus métodos
export interface IPaymentGateway {
    // Define el contrato para interactuar con Stripe, PayPal, etc.
    processTransaction(amount: number, token: string): Promise<Result<string, Error>>;
}

export interface PaymentProps {
  id: UUID;
  bookingId: UUID; // Referencia al servicio de Booking
  userId: UUID; // Usuario que paga
  amount: number;
  currency: string;
  externalTransactionId: string | null; // ID devuelto por Stripe/PayPal
  status: PaymentStatus;
  createdAt: Date;
}

export class Payment {
  readonly id: UUID;
  readonly bookingId: UUID;
  readonly userId: UUID;
  readonly amount: number;
  readonly currency: string;
  readonly externalTransactionId: string | null;
  readonly status: PaymentStatus;
  readonly createdAt: Date;

  private constructor(props: PaymentProps) {
    this.id = props.id;
    this.bookingId = props.bookingId;
    this.userId = props.userId;
    this.amount = props.amount;
    this.currency = props.currency;
    this.externalTransactionId = props.externalTransactionId;
    this.status = props.status;
    this.createdAt = props.createdAt;
  }

  // Lógica de Negocio: Creación inicial
  public static createPending(props: {
    bookingId: UUID;
    userId: UUID;
    amount: number;
    currency: string;
  }): Payment {
    return new Payment({
      ...props,
      id: new UUID(), 
      externalTransactionId: null,
      status: 'pending', // Siempre comienza como pendiente
      createdAt: new Date(),
    });
  }

  // Lógica de Negocio: Marcar como exitoso después de la pasarela
  public markAsSucceeded(transactionId: string): Result<void, Error> {
    if (this.status !== 'pending') {
      return err(new Error(`Cannot mark payment as succeeded, current status is ${this.status}.`));
    }
    (this as any).status = 'succeeded';
    (this as any).externalTransactionId = transactionId;
    return ok(undefined);
  }

  // Lógica de Negocio: Marcar como fallido
  public markAsFailed(): Result<void, Error> {
    if (this.status !== 'pending') {
      return err(new Error('Cannot mark payment as failed.'));
    }
    (this as any).status = 'failed';
    return ok(undefined);
  }
}