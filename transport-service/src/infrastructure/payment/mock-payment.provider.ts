import { Injectable, Logger } from '@nestjs/common';
import type {
  IPaymentGateway,
  InitiatePaymentInput,
  InitiatePaymentResult,
  PaymentStatusResult,
  WebhookResult,
} from './payment-gateway.interface';

/**
 * MockPaymentProvider — Simulador local para desarrollo y sandbox.
 *
 * Activo cuando PAYMENT_PROVIDER=mock (o cuando no hay credenciales DATAFAST).
 *
 * Comportamiento:
 * - Aprueba pagos cuyo monto NO termina en .99 (para simular rechazos fácilmente).
 * - Genera una redirectUrl a /payment/mock-checkout en el mismo origen.
 * - El mock checkout redirige automáticamente a returnUrl con status=approved.
 */
@Injectable()
export class MockPaymentProvider implements IPaymentGateway {
  readonly name    = 'mock';
  readonly defaultMode = 'redirect' as const;

  private readonly logger = new Logger(MockPaymentProvider.name);
  private readonly store  = new Map<string, { status: string; gatewayRef: string; paidAt?: Date }>();

  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    this.logger.log(`[MOCK] Iniciando pago ${input.transactionId} por $${input.amountUsd}`);

    const gatewayRef = `MOCK-${Date.now()}`;
    this.store.set(input.transactionId, { status: 'pending', gatewayRef });

    // Construir URL del mock checkout
    const params = new URLSearchParams({
      transactionId: input.transactionId,
      amount:        String(input.amountUsd),
      description:   input.description,
      returnUrl:     input.returnUrl,
      cancelUrl:     input.cancelUrl,
    });

    return {
      mode:        'redirect',
      transactionId: input.transactionId,
      redirectUrl: `${process.env.APP_BASE_URL ?? 'http://localhost:3000'}/payment/mock-checkout?${params}`,
    };
  }

  async getStatus(transactionId: string): Promise<PaymentStatusResult> {
    const entry = this.store.get(transactionId);
    if (!entry) {
      return { transactionId, status: 'error', error: 'Transacción no encontrada' };
    }
    return {
      transactionId,
      status:     entry.status as any,
      gatewayRef: entry.gatewayRef,
      paidAt:     entry.paidAt,
    };
  }

  async handleWebhook(
    _headers: Record<string, string>,
    body: Record<string, unknown>,
  ): Promise<WebhookResult> {
    const transactionId = String(body.transactionId ?? '');
    const status        = String(body.status ?? 'approved');

    this.store.set(transactionId, {
      status,
      gatewayRef: `MOCK-WH-${Date.now()}`,
      paidAt:     status === 'approved' ? new Date() : undefined,
    });

    return {
      transactionId,
      status: status as any,
      gatewayRef: `MOCK-WH-${Date.now()}`,
      raw: body,
    };
  }

  /** Llamado desde el mock checkout para aprobar manualmente */
  confirmMock(transactionId: string, approve = true) {
    const entry = this.store.get(transactionId);
    if (entry) {
      entry.status = approve ? 'approved' : 'rejected';
      entry.paidAt = approve ? new Date() : undefined;
    }
  }
}
