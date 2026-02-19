/**
 * Money Value Object
 * Represents currency amount
 */
export class Money {
  readonly amount: number;
  readonly currency: string = 'USD';

  constructor(amount: number, currency: string = 'USD') {
    if (amount < 0) {
      throw new Error(`Invalid amount: ${amount}. Must be non-negative`);
    }

    this.amount = Math.round(amount * 100) / 100; // Round to 2 decimals
    this.currency = currency;
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error('Cannot add different currencies');
    }
    return new Money(this.amount + other.amount, this.currency);
  }

  subtract(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error('Cannot subtract different currencies');
    }
    const result = this.amount - other.amount;
    if (result < 0) {
      throw new Error('Result cannot be negative');
    }
    return new Money(result, this.currency);
  }

  multiply(factor: number): Money {
    if (factor < 0) {
      throw new Error('Multiplication factor must be non-negative');
    }
    return new Money(this.amount * factor, this.currency);
  }

  equals(other: Money): boolean {
    return (
      this.amount === other.amount && this.currency === other.currency
    );
  }

  isGreaterThan(other: Money): boolean {
    return this.amount > other.amount;
  }

  isLessThan(other: Money): boolean {
    return this.amount < other.amount;
  }

  toString(): string {
    const symbol = this.currency === 'USD' ? '$' : this.currency;
    return `${symbol}${this.amount.toFixed(2)}`;
  }

  toJSON() {
    return {
      amount: this.amount,
      currency: this.currency,
    };
  }
}
