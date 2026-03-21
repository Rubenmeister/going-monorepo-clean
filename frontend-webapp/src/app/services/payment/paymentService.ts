/**
 * PaymentService — Cliente HTTP para la pasarela de pagos Going/DATAFAST.
 *
 * Flujos soportados:
 *  - redirect   → backend retorna redirectUrl, frontend redirige
 *  - lightbox   → backend retorna token + checkoutJsUrl, frontend carga el SDK
 *  - direct_api → frontend envía datos de tarjeta → backend los reenvía a DATAFAST
 */

import type {
  PaymentSummary,
  InitiatePaymentResult,
  PaymentStatusResult,
} from '@/types';
import { PLATFORM_FEE_PERCENTAGE } from '@/types';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://api-gateway-780842550857.us-central1.run.app';

class PaymentService {
  // ─── Cálculo de resumen ───────────────────────────────────────────────────────

  calculatePaymentSummary(amount: number): PaymentSummary {
    const baseFare    = amount / (1 + PLATFORM_FEE_PERCENTAGE / 100);
    const platformFee = amount - baseFare;
    return {
      baseFare:              Math.round(baseFare    * 100) / 100,
      platformFeePercentage: PLATFORM_FEE_PERCENTAGE,
      platformFee:           Math.round(platformFee * 100) / 100,
      total:                 amount,
    };
  }

  // ─── Iniciar pago (nuevo flujo con DATAFAST) ──────────────────────────────────

  async initiatePayment(params: {
    rideId:       string;
    amountUsd:    number;
    description?: string;
    cardDetails?: {           // Solo para modo direct_api
      number:      string;
      expiryMonth: string;
      expiryYear:  string;
      cvv:         string;
      holderName:  string;
    };
  }): Promise<InitiatePaymentResult> {
    const token = typeof window !== 'undefined'
      ? localStorage.getItem('authToken')
      : null;

    const res = await fetch(`${API_BASE}/payments/initiate`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as Record<string, any>;
      throw new Error(err?.message ?? `Error al iniciar pago (HTTP ${res.status})`);
    }

    return res.json() as Promise<InitiatePaymentResult>;
  }

  // ─── Consultar estado (para polling tras redirect) ────────────────────────────

  async getPaymentStatus(transactionId: string): Promise<PaymentStatusResult> {
    const token = typeof window !== 'undefined'
      ? localStorage.getItem('authToken')
      : null;

    const res = await fetch(`${API_BASE}/payments/${transactionId}/status`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!res.ok) {
      throw new Error(`No se pudo obtener el estado del pago (HTTP ${res.status})`);
    }

    return res.json() as Promise<PaymentStatusResult>;
  }

  // ─── Validación de tarjeta (local, solo para direct_api) ─────────────────────

  validateCardDetails(cardNumber: string, expiryDate: string, cvv: string): boolean {
    const cardRegex   = /^\d{13,19}$/;
    const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
    const cvvRegex    = /^\d{3,4}$/;
    return (
      cardRegex.test(cardNumber.replace(/\s/g, '')) &&
      expiryRegex.test(expiryDate) &&
      cvvRegex.test(cvv)
    );
  }

  // ─── Métodos disponibles ──────────────────────────────────────────────────────

  async getAvailablePaymentMethods(_userId: string): Promise<string[]> {
    return ['datafast', 'cash'];
  }
}

export const paymentService = new PaymentService();
