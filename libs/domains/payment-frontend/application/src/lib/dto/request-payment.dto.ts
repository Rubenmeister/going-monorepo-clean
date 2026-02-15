export interface RequestPaymentDto {
  userId: string;
  referenceId: string;
  amount: {
    amount: number;
    currency: string;
  };
}
