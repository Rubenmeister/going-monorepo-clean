import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import type {
  IPaymentGateway,
  InitiatePaymentInput,
  InitiatePaymentResult,
  PaymentMode,
  PaymentStatus,
  PaymentStatusResult,
  WebhookResult,
} from './payment-gateway.interface';

/**
 * DatafastProvider — Integración con DATAFAST Ecuador (los 3 modos).
 *
 * Variables de entorno requeridas:
 *   DATAFAST_MERCHANT_ID      — Tu merchant ID asignado por DATAFAST
 *   DATAFAST_TERMINAL_ID      — Terminal ID (proporcionado por DATAFAST)
 *   DATAFAST_API_KEY          — Clave de API / secret para firmar requests
 *   DATAFAST_API_URL          — URL base API (sandbox o producción)
 *   DATAFAST_CHECKOUT_JS_URL  — URL del JS SDK para modo lightbox
 *   DATAFAST_MODE             — 'redirect' | 'lightbox' | 'direct_api' (default: redirect)
 *   DATAFAST_WEBHOOK_SECRET   — Secret para verificar la firma del webhook
 *
 * Sandbox:     https://ccapi-test.datafast.com.ec
 * Producción:  https://ccapi.datafast.com.ec
 *
 * Documentación DATAFAST: https://developers.datafast.com.ec
 */
@Injectable()
export class DatafastProvider implements IPaymentGateway {
  readonly name = 'datafast';
  readonly defaultMode: PaymentMode;

  private readonly logger   = new Logger(DatafastProvider.name);
  private readonly baseUrl:  string;
  private readonly merchantId:  string;
  private readonly terminalId:  string;
  private readonly apiKey:      string;
  private readonly webhookSecret: string;
  private readonly checkoutJsUrl: string;

  constructor(private readonly config: ConfigService) {
    this.baseUrl       = config.get('DATAFAST_API_URL',
      'https://ccapi-test.datafast.com.ec');  // sandbox por defecto
    this.merchantId    = config.get('DATAFAST_MERCHANT_ID',  '');
    this.terminalId    = config.get('DATAFAST_TERMINAL_ID',  '');
    this.apiKey        = config.get('DATAFAST_API_KEY',       '');
    this.webhookSecret = config.get('DATAFAST_WEBHOOK_SECRET', '');
    this.checkoutJsUrl = config.get('DATAFAST_CHECKOUT_JS_URL',
      'https://ccapi-test.datafast.com.ec/paymentWidgets.js');
    this.defaultMode   = (config.get('DATAFAST_MODE', 'redirect') as PaymentMode);

    if (!this.merchantId || !this.apiKey) {
      this.logger.warn('DATAFAST no configurado — verifica DATAFAST_MERCHANT_ID y DATAFAST_API_KEY');
    } else {
      this.logger.log(`DATAFAST habilitado · modo=${this.defaultMode} · url=${this.baseUrl}`);
    }
  }

  // ─── Modo 1: REDIRECT ────────────────────────────────────────────────────────
  // Crear sesión de checkout, DATAFAST devuelve una URL a la que redirigimos.

  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    switch (this.defaultMode) {
      case 'lightbox':   return this._initiateLightbox(input);
      case 'direct_api': return this._initiateDirectApi(input);
      default:           return this._initiateRedirect(input);
    }
  }

  private async _initiateRedirect(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    const body = {
      authentication: this._auth(),
      amount: {
        total:    input.amountUsd.toFixed(2),
        currency: 'USD',
      },
      transaction: {
        merchantTransactionId: input.transactionId,
        description:           input.description,
      },
      customer: { id: input.userId },
      redirect: {
        returnUrl: input.returnUrl,
        cancelUrl: input.cancelUrl,
      },
    };

    const res  = await this._post('/v1/checkouts', body);
    const data = await res.json() as Record<string, any>;

    if (!res.ok) {
      this.logger.error(`DATAFAST redirect error: ${JSON.stringify(data)}`);
      throw new Error(`DATAFAST error ${res.status}: ${data?.result?.description ?? 'sin descripción'}`);
    }

    const checkoutId = data.id ?? data.checkoutId;
    const redirectUrl = `${this.baseUrl}/v1/paymentWidgets.js?checkoutId=${checkoutId}`;

    return { mode: 'redirect', transactionId: input.transactionId, redirectUrl };
  }

  // ─── Modo 2: LIGHTBOX ────────────────────────────────────────────────────────
  // Mismo flujo que redirect pero devolvemos el token para el JS SDK.

  private async _initiateLightbox(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    const result = await this._initiateRedirect(input);
    // En lightbox el frontend usa el mismo checkoutId con el JS de DATAFAST
    const token = result.redirectUrl?.split('checkoutId=')[1] ?? '';

    return {
      mode:           'lightbox',
      transactionId:  input.transactionId,
      token,
      checkoutJsUrl:  this.checkoutJsUrl,
    };
  }

  // ─── Modo 3: DIRECT API ───────────────────────────────────────────────────────
  // Envío directo de datos de tarjeta — requiere PCI DSS.

  private async _initiateDirectApi(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    if (!input.cardDetails) {
      throw new Error('cardDetails requerido para modo direct_api');
    }

    const { number, expiryMonth, expiryYear, cvv, holderName } = input.cardDetails;

    const body = {
      authentication: this._auth(),
      amount: {
        value:    Math.round(input.amountUsd * 100),  // en centavos
        currency: 'USD',
      },
      payment: {
        card: {
          number:      number.replace(/\s/g, ''),
          expiryMonth,
          expiryYear,
          cvv,
          holder:      holderName,
        },
      },
      transaction: {
        merchantTransactionId: input.transactionId,
        description:           input.description,
      },
    };

    const res  = await this._post('/v1/payments', body);
    const data = await res.json() as Record<string, any>;
    const code = String(data?.result?.code ?? '');

    // DATAFAST usa códigos de resultado: 000.000.000 = aprobado
    const approved = code.startsWith('000.000') || code.startsWith('000.100');
    const status: PaymentStatus = res.ok && approved ? 'approved' : 'rejected';

    if (!res.ok || !approved) {
      this.logger.warn(`DATAFAST direct_api rechazo: ${JSON.stringify(data?.result)}`);
    }

    return {
      mode:          'direct_api',
      transactionId: input.transactionId,
      status,
      gatewayRef:    data?.id ?? data?.registrationId,
    };
  }

  // ─── Status ───────────────────────────────────────────────────────────────────

  async getStatus(transactionId: string): Promise<PaymentStatusResult> {
    const res  = await this._get(`/v1/payments?merchantTransactionId=${transactionId}`);
    const data = await res.json() as Record<string, any>;

    if (!res.ok) {
      return { transactionId, status: 'error', error: data?.result?.description };
    }

    const code     = String(data?.result?.code ?? '');
    const approved = code.startsWith('000.000') || code.startsWith('000.100');

    return {
      transactionId,
      status:     approved ? 'approved' : data.status === 'pending' ? 'processing' : 'rejected',
      gatewayRef: data.id,
      amount:     parseFloat(data?.amount?.total ?? '0'),
      paidAt:     approved ? new Date(data.timestamp ?? Date.now()) : undefined,
    };
  }

  // ─── Webhook ──────────────────────────────────────────────────────────────────

  async handleWebhook(
    headers: Record<string, string>,
    body: Record<string, unknown>,
  ): Promise<WebhookResult> {
    // Verificar firma HMAC si está configurada
    if (this.webhookSecret) {
      const signature = headers['x-datafast-signature'] ?? headers['x-signature'] ?? '';
      const computed  = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(JSON.stringify(body))
        .digest('hex');

      if (signature !== computed) {
        this.logger.error('Firma de webhook DATAFAST inválida — posible intento de fraude');
        throw new Error('Webhook signature mismatch');
      }
    }

    const transactionId = String(body.merchantTransactionId ?? body.transactionId ?? '');
    const code          = String((body as any)?.result?.code ?? '');
    const approved      = code.startsWith('000.000') || code.startsWith('000.100');
    const status: PaymentStatus = approved ? 'approved' : 'rejected';

    this.logger.log(`Webhook DATAFAST: txn=${transactionId} status=${status}`);

    return {
      transactionId,
      status,
      gatewayRef: String(body.id ?? ''),
      raw: body,
    };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  private _auth() {
    return {
      merchantId: this.merchantId,
      terminalId: this.terminalId,
      secret:     this.apiKey,
    };
  }

  private _post(path: string, body: unknown) {
    return fetch(`${this.baseUrl}${path}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}` },
      body:    JSON.stringify(body),
    });
  }

  private _get(path: string) {
    return fetch(`${this.baseUrl}${path}`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` },
    });
  }
}
