import { Result, ok, err } from 'neverthrow';

export type Currency = 'USD'; // Puedes añadir más monedas aquí

export interface MoneyProps {
  amount: number; // Siempre en centavos
  currency: Currency;
}

export class Money {
  readonly amount: number;
  readonly currency: Currency;

  private constructor(props: MoneyProps) {
    this.amount = props.amount;
    this.currency = props.currency;
  }

  public static create(amount: number, currency: string): Result<Money, Error> {
    const upperCurrency = currency.toUpperCase() as Currency;
    
    if (upperCurrency !== 'USD') {
      return err(new Error('Invalid currency'));
    }
    if (amount < 0) {
      return err(new Error('Amount cannot be negative'));
    }
    if (!Number.isInteger(amount)) {
      return err(new Error('Amount must be in cents (an integer)'));
    }

    return ok(new Money({ amount, currency: upperCurrency }));
  }

  public isPositive(): boolean {
    return this.amount > 0;
  }

  // --- Métodos de Persistencia ---

  public toPrimitives(): MoneyProps {
    return {
      amount: this.amount,
      currency: this.currency,
    };
  }

  public static fromPrimitives(props: MoneyProps): Money {
    return new Money(props);
  }
}