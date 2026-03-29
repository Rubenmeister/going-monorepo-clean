import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatafastProvider } from './datafast.provider';
import { DeUnaProvider } from './deuna.provider';
import { MockPaymentProvider } from './mock-payment.provider';
import type {
  IPaymentGateway,
  PaymentMethod,
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
 * PaymentGatewayService — Soporta Datafast y DeUna simultáneamente.
 *
 * Selección por método de pago (campo paymentMethod en el input):
 *   'card'     → Datafast  (tarjeta de crédito/débito, flujo PA → CP)
 *   'transfer' → DeUna     (QR Banco Pichincha, pago inmediato)
 *
 * Si no se especifica paymentMethod:
 *   - Si Datafast configurado → tarjeta por defecto
 *   - Si solo DeUna → QR
 *   - Si ninguno → Mock (desarrollo)
 *
 * Variables de entorno (ambos pueden coexistir):
 *   DATAFAST_ENTITY_ID, DATAFAST_API_KEY, DATAFAST_API_URL ...
 *   DEUNA_API_KEY, DEUNA_SECRET_KEY, DEUNA_STORE_CODE, DEUNA_API_URL ...
 */
@Injectable()
export class PaymentGatewayService {
  private readonly logger = new Logger(PaymentGatewayService.name);

  private readonly datafastEnabled: boolean;
  private readonly deunaEnabled:    boolean;

  constructor(
    private readonly config:   ConfigService,
    private readonly datafast: DatafastProvider,
    private readonly deuna:    DeUnaProvider,
    private readonly mock:     MockPaymentProvider,
  ) {
    this.datafastEnabled = !!(
      config.get<string>('DATAFAST_ENTITY_ID', '') &&
      config.get<string>('DATAFAST_API_KEY', '')
    );
    this.deunaEnabled = !!(
      config.get<string>('DEUNA_API_KEY', '') &&
      config.get<string>('DEUNA_STORE_CODE', '')
    );

    this.logger.log(
      `Proveedores de pago: Datafast=${this.datafastEnabled ? '✓' : '✗'} | DeUna=${this.deunaEnabled ? '✓' : '✗'}`,
    );

    if (!this.datafastEnabled && !this.deunaEnabled) {
      this.logger.warn('Ningún proveedor real configurado — usando Mock');
    }
  }

  // ─── Selección de proveedor según método ─────────────────────────────────────

  /** Retorna el proveedor adecuado según el método elegido por el pasajero */
  resolve(method?: PaymentMethod): IPaymentGateway {
    if (this.config.get<string>('PAYMENT_PROVIDER', '').toLowerCase() === 'mock') {
      return this.mock;
    }
    if (method === 'transfer') {
      return this.deunaEnabled ? this.deuna : this.mock;
    }
    if (method === 'card') {
      return this.datafastEnabled ? this.datafast : this.mock;
    }
    // Sin método especificado → prioridad: Datafast > DeUna > Mock
    if (this.datafastEnabled) return this.datafast;
    if (this.deunaEnabled)    return this.deuna;
    return this.mock;
  }

  /** Métodos de pago disponibles para mostrar al pasajero */
  availableMethods(): Array<{ method: PaymentMethod; label: string; icon: string }> {
    const methods: Array<{ method: PaymentMethod; label: string; icon: string }> = [];
    if (this.datafastEnabled) {
      methods.push({ method: 'card',     label: 'Tarjeta de crédito/débito', icon: '💳' });
    }
    if (this.deunaEnabled) {
      methods.push({ method: 'transfer', label: 'DeUna / Banco Pichincha',   icon: '📱' });
    }
    return methods;
  }

  // ─── Operaciones — delegan al proveedor correcto ──────────────────────────────

  initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    return this.resolve(input.paymentMethod).initiatePayment(input);
  }

  authorize(input: AuthorizeInput): Promise<AuthorizeResult> {
    return this.resolve(input.paymentMethod).authorize(input);
  }

  capture(input: CaptureInput, method?: PaymentMethod): Promise<CaptureResult> {
    return this.resolve(method).capture(input);
  }

  getStatus(transactionId: string, method?: PaymentMethod): Promise<PaymentStatusResult> {
    return this.resolve(method).getStatus(transactionId);
  }

  // ─── Webhooks — enrutados por proveedor ──────────────────────────────────────

  handleWebhook(
    provider: 'datafast' | 'deuna',
    headers:  Record<string, string>,
    body:     Record<string, unknown>,
  ): Promise<WebhookResult> {
    if (provider === 'datafast') return this.datafast.handleWebhook(headers, body);
    if (provider === 'deuna')    return this.deuna.handleWebhook(headers, body);
    return this.mock.handleWebhook(headers, body);
  }

  // Acceso directo al mock para el endpoint /mock-checkout (solo en desarrollo)
  get mockProvider(): MockPaymentProvider | null {
    return this.datafastEnabled || this.deunaEnabled ? null : this.mock;
  }
}
