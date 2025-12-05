export class PaymentMethodVO {
  constructor(private readonly value: string) {
    if (!['CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'WALLET', 'CASH'].includes(value)) {
      throw new Error('Invalid payment method');
    }
  }

  getValue(): string {
    return this.value;
  }
}
