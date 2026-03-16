import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatafastProvider } from './datafast.provider';
import { MockPaymentProvider } from './mock-payment.provider';
import type {
  IPaymentGateway,
  InitiatePaymentInput,
  InitiatePaymentResult,
  PaymentStatusResult,
  WebhookResult,
} from './payment-gateway.interface';

/**
 * PaymentGatewayService — Fachada que selecciona el proveedor activo.
 *
 * Lógica de selección (en orden):
 *  1. Si PAYMENT_PROVIDER=mock → MockPaymentProvider (desarrollo/sandbox)
 *  2. Si DATAFAST_MERCHANT_ID y DATAFAST_API_KEY están presentes → DatafastProvider
 *  3. Fallback → MockPaymentProvider con advertencia
 *
 * Añadir un nuevo proveedor (ej. PayPhone Ecuador):
 *  - Crear PayphoneProvider implements IPaymentGateway
 *  - Registrarlo en el constructor y en selectProvider()
 *  - Establecer PAYMENT_PROVIDER=payphone en .env
 */
@Injectable()
export class PaymentGatewayService implements IPaymentGateway {
  private readonly logger   = new Logger(PaymentGatewayService.name);
  private readonly provider: IPaymentGateway;

  constructor(
    private readonly config:   ConfigService,
    private readonly datafast: DatafastProvider,
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

  getStatus(transactionId: string): Promise<PaymentStatusResult> {
    return this.provider.getStatus(transactionId);
  }

  handleWebhook(
    headers: Record<string, string>,
    body: Record<string, unknown>,
  ): Promise<WebhookResult> {
    return this.provider.handleWebhook(headers, body);
  }

  // ─── Acceso directo al mock para el endpoint /mock-checkout ──────────────────
  get mockProvider(): MockPaymentProvider | null {
    return this.provider instanceof MockPaymentProvider ? this.provider : null;
  }

  // ─── Selección de proveedor ───────────────────────────────────────────────────

  private selectProvider(): IPaymentGateway {
    const providerName = this.config.get('PAYMENT_PROVIDER', '').toLowerCase();

    if (providerName === 'mock') {
      this.logger.warn('Usando MockPaymentProvider — no apto para producción');
      return this.mock;
    }

    const merchantId = this.config.get('DATAFAST_MERCHANT_ID', '');
    const apiKey     = this.config.get('DATAFAST_API_KEY', '');

    if (merchantId && apiKey) return this.datafast;

    this.logger.warn(
      'No hay proveedor de pagos configurado — usando mock. ' +
      'Configura DATAFAST_MERCHANT_ID y DATAFAST_API_KEY para activar DATAFAST.'
    );
    return this.mock;
  }
}
