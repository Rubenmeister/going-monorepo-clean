import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatafastProvider } from './datafast.provider';
import { DeUnaProvider } from './deuna.provider';
import { MockPaymentProvider } from './mock-payment.provider';
import type {
  IPaymentGateway,
  InitiatePaymentInput,
  InitiatePaymentResult,
  AuthorizeInput,
  AuthorizeResult,
  CaptureInput,
  CaptureResult,
  PaymentStatusResult,
  WebhookResult,
} from './payment-gateway.interface';

/**
 * PaymentGatewayService — Fachada que selecciona el proveedor activo.
 *
 * Lógica de selección (en orden de prioridad):
 *  1. PAYMENT_PROVIDER=mock      → MockPaymentProvider (desarrollo/tests)
 *  2. PAYMENT_PROVIDER=deuna     → DeUnaProvider (QR Banco Pichincha)
 *  3. DATAFAST_ENTITY_ID + KEY   → DatafastProvider (tarjetas PA/CP)
 *  4. Fallback                   → MockPaymentProvider con advertencia
 *
 * Variables de entorno:
 *  PAYMENT_PROVIDER = 'datafast' | 'deuna' | 'mock'
 */
@Injectable()
export class PaymentGatewayService implements IPaymentGateway {
  private readonly logger   = new Logger(PaymentGatewayService.name);
  private readonly provider: IPaymentGateway;

  constructor(
    private readonly config:   ConfigService,
    private readonly datafast: DatafastProvider,
    private readonly deuna:    DeUnaProvider,
    private readonly mock:     MockPaymentProvider,
  ) {
    this.provider = this.selectProvider();
    this.logger.log(`Proveedor de pagos activo: ${this.provider.name}`);
  }

  get name()        { return this.provider.name; }
  get defaultMode() { return this.provider.defaultMode; }

  initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    return this.provider.initiatePayment(input);
  }

  authorize(input: AuthorizeInput): Promise<AuthorizeResult> {
    return this.provider.authorize(input);
  }

  capture(input: CaptureInput): Promise<CaptureResult> {
    return this.provider.capture(input);
  }

  getStatus(transactionId: string): Promise<PaymentStatusResult> {
    return this.provider.getStatus(transactionId);
  }

  handleWebhook(
    headers: Record<string, string>,
    body: Record<string, unknown>,
  ): Promise<WebhookResult> {
    return this.provider.handleWebhook(headers, body);
  }

  // Acceso directo al mock para el endpoint /mock-checkout
  get mockProvider(): MockPaymentProvider | null {
    return this.provider instanceof MockPaymentProvider ? this.provider : null;
  }

  // ─── Selección de proveedor ───────────────────────────────────────────────────

  private selectProvider(): IPaymentGateway {
    const name = this.config.get('PAYMENT_PROVIDER', '').toLowerCase();

    if (name === 'mock') {
      this.logger.warn('Usando MockPaymentProvider — no apto para producción');
      return this.mock;
    }

    if (name === 'deuna') {
      const apiKey = this.config.get('DEUNA_API_KEY', '');
      if (!apiKey) this.logger.warn('PAYMENT_PROVIDER=deuna pero DEUNA_API_KEY no configurado');
      return this.deuna;
    }

    if (name === 'datafast' || (!name && this.config.get('DATAFAST_ENTITY_ID', '') && this.config.get('DATAFAST_API_KEY', ''))) {
      return this.datafast;
    }

    this.logger.warn(
      'No hay proveedor de pagos configurado — usando mock. ' +
      'Configura PAYMENT_PROVIDER=datafast o PAYMENT_PROVIDER=deuna.',
    );
    return this.mock;
  }
}
