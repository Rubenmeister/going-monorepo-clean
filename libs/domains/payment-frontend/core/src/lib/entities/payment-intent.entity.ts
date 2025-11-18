import { UUID, Money } from '@going-monorepo-clean/shared-domain'; // Reemplaza con tu scope

export interface PaymentIntentProps {
  id: string; // El ID del Payment Intent de Stripe
  clientSecret: string; // La clave secreta para el SDK de Stripe
  amount: Money;
  referenceId: UUID; // La ID de la reserva o servicio
}

export class PaymentIntent {
  readonly id: string;
  readonly clientSecret: string;
  readonly amount: Money;
  readonly referenceId: UUID;

  constructor(props: PaymentIntentProps) {
    this.id = props.id;
    this.clientSecret = props.clientSecret;
    this.amount = props.amount;
    this.referenceId = props.referenceId;
  }

  // --- Métodos de Persistencia ---
  
  public static fromPrimitives(props: any): PaymentIntent {
    return new PaymentIntent({
      ...props,
      amount: Money.fromPrimitives(props.amount),
    });
  }
}