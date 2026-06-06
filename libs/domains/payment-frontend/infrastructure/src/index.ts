import { Result, ok, err } from 'neverthrow';
import type { IPaymentGateway, PaymentIntent, PaymentRequestData } from '@going-monorepo-clean/domains-payment-frontend-core';

const API_BASE = process.env['NX_API_URL'] || '/api';

export class HttpPaymentGateway implements IPaymentGateway {
  async requestIntent(data: PaymentRequestData, token: string): Promise<Result<PaymentIntent, Error>> {
    const res = await fetch(`${API_BASE}/payments/intents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        userId: data.userId,
        referenceId: data.referenceId,
        amount: data.amount,
      }),
    });
    if (!res.ok) return err(new Error(`Error al crear intención de pago: ${res.status}`));
    return ok(await res.json());
  }

  async confirmPayment(paymentIntentId: string, token: string): Promise<Result<void, Error>> {
    const res = await fetch(`${API_BASE}/payments/intents/${paymentIntentId}/confirm`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return err(new Error(`Error al confirmar pago: ${res.status}`));
    return ok(undefined);
  }
}
