import { httpClient } from './http.client';

export interface CreatePaymentIntentRequest {
  userId: string;
  referenceId: string;
  price: {
    amount: number;
    currency: string;
  };
}

export interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: string;
}

export class PaymentClient {
  async requestPaymentIntent(
    data: CreatePaymentIntentRequest
  ): Promise<PaymentIntent> {
    return httpClient.post<PaymentIntent>('/payments/intent', data);
  }
}

export const paymentClient = new PaymentClient();
