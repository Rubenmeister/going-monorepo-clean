import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import type {
  IPaymentGateway,
  InitiatePaymentInput,
  InitiatePaymentResult,
  AuthorizeInput,
  AuthorizeResult,
  CaptureInput,
  CaptureResult,
  PaymentMode,
  PaymentStatus,
  PaymentStatusResult,
  WebhookResult,
} from './payment-gateway.interface';

/**
 * DeUnaProvider — Integración con DeUna (Banco Pichincha) Ecuador.
 *
 * DeUna es un sistema de pago QR vinculado a Banca Móvil Banco Pichincha.
 * NO soporta pre-autorización bancaria clásica (PA/CP como OPPWA).
 *
 * Flujo para viajes Going:
 *  1. Al iniciar el viaje → authorize() crea una orden de pago DeUna
 *     → devuelve QR + link que el pasajero confirma en su app Pichincha/DeUna
 *  2. DeUna notifica el pago via webhook → el viaje avanza a "en curso"
 *  3. Al terminar el viaje → capture() verifica el estado
 *     Si el monto real > estimado → crea una nueva orden por la diferencia
 *  4. Si el pasajero no confirma el QR → se cancela la orden y se notifica
 *
 * Variables de entorno requeridas:
 *   DEUNA_API_URL     — URL base API DeUna (sandbox o producción)
 *   DEUNA_API_KEY     — API Key proporcionada por DeUna/Pichincha
 *   DEUNA_SECRET_KEY  — Secret Key para firma de webhooks
 *   DEUNA_STORE_CODE  — Código de comercio / caja registradora
 *
 * Sandbox:     https://api.sandbox.deuna.io  (verificar con DeUna)
 * Producción:  https://api.deuna.io          (verificar con DeUna)
 *
 * Documentación: contactar integrations@deuna.ec para acceso al portal de desarrolladores
 */
@Injectable()
export class DeUnaProvider implements IPaymentGateway {
  readonly name        = 'deuna';
  readonly defaultMode: PaymentMode = 'qr';

  private readonly logger     = new Logger(DeUnaProvider.name);
  private readonly baseUrl:   string;
  private readonly apiKey:    string;
  private readonly secretKey: string;
  private readonly storeCode: string;

  constructor(private readonly config: ConfigService) {
    this.baseUrl   = config.get('DEUNA_API_URL',     'https://api.sandbox.deuna.io');
    this.apiKey    = config.get('DEUNA_API_KEY',     '');
    this.secretKey = config.get('DEUNA_SECRET_KEY',  '');
    this.storeCode = config.get('DEUNA_STORE_CODE',  '');

    if (!this.apiKey || !this.storeCode) {
      this.logger.warn('DEUNA no configurado — verifica DEUNA_API_KEY y DEUNA_STORE_CODE');
    } else {
      this.logger.log(`DEUNA habilitado · url=${this.baseUrl}`);
    }
  }

  // ─── Checkout (pago inmediato one-shot) ───────────────────────────────────────

  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    const result = await this._createOrder({
      orderId:     input.transactionId,
      rideId:      input.rideId,
      userId:      input.userId,
      amountUsd:   input.amountUsd,
      description: input.description,
      callbackUrl: input.returnUrl,
    });

    return {
      mode:           'qr',
      transactionId:  input.transactionId,
      qrCodeUrl:      result.qrCodeUrl,
      qrPaymentLink:  result.paymentLink,
      gatewayRef:     result.orderId,
    };
  }

  // ─── Authorize — crea orden de pago QR ───────────────────────────────────────
  // En DeUna no existe pre-auth bancaria. authorize() crea la orden y devuelve
  // el QR para que el pasajero confirme. El viaje inicia cuando DeUna notifica
  // el pago via webhook (status = 'completed').

  async authorize(input: AuthorizeInput): Promise<AuthorizeResult> {
    try {
      const result = await this._createOrder({
        orderId:     input.transactionId,
        rideId:      input.rideId,
        userId:      input.userId,
        amountUsd:   input.amountUsd,
        description: input.description,
        callbackUrl: `${this.config.get('API_BASE_URL', '')}/api/payment/webhook/deuna`,
      });

      this.logger.log(`DEUNA orden creada: orderId=${result.orderId} monto=${input.amountUsd}`);

      return {
        transactionId:  input.transactionId,
        gatewayRef:     result.orderId,
        status:         'pending_qr',     // El pasajero aún no ha confirmado
        qrCodeUrl:      result.qrCodeUrl,
        qrPaymentLink:  result.paymentLink,
      };
    } catch (err: any) {
      this.logger.error(`DEUNA authorize error: ${err?.message}`);
      return {
        transactionId: input.transactionId,
        gatewayRef:    '',
        status:        'rejected',
        error:         err?.message ?? 'Error al crear orden DeUna',
      };
    }
  }

  // ─── Capture — verifica pago y cobra diferencia si aplica ─────────────────────
  // Para DeUna el "capture" verifica que el QR fue pagado.
  // Si el monto real > estimado → crea una nueva orden por la diferencia.

  async capture(input: CaptureInput): Promise<CaptureResult> {
    const statusResult = await this.getStatus(input.transactionId);

    if (statusResult.status === 'approved') {
      const paid    = statusResult.amount ?? 0;
      const extra   = parseFloat((input.amountUsd - paid).toFixed(2));

      if (extra > 0.01) {
        // Crear orden adicional por el exceso de distancia
        this.logger.log(`DEUNA cobro extra: $${extra} (real ${input.amountUsd} vs estimado ${paid})`);
        try {
          await this._createOrder({
            orderId:     `${input.transactionId}_extra`,
            rideId:      input.gatewayRef,
            userId:      '',
            amountUsd:   extra,
            description: 'Cargo adicional por distancia extra',
            callbackUrl: `${this.config.get('API_BASE_URL', '')}/api/payment/webhook/deuna`,
          });
        } catch (err: any) {
          this.logger.error(`DEUNA cobro extra fallido: ${err?.message}`);
        }
      }

      return {
        transactionId: input.transactionId,
        gatewayRef:    input.gatewayRef,
        status:        'approved',
        chargedAmount: input.amountUsd,
      };
    }

    // El pago QR no fue confirmado
    return {
      transactionId: input.transactionId,
      gatewayRef:    input.gatewayRef,
      status:        statusResult.status === 'processing' ? 'processing' : 'rejected',
      chargedAmount: 0,
      error:         statusResult.error ?? 'Pago DeUna no confirmado',
    };
  }

  // ─── Status ───────────────────────────────────────────────────────────────────

  async getStatus(transactionId: string): Promise<PaymentStatusResult> {
    try {
      const res  = await this._get(`/v1/orders/${transactionId}`);
      const data = await res.json() as Record<string, any>;

      if (!res.ok) {
        return { transactionId, status: 'error', error: data?.message ?? 'Error al consultar estado' };
      }

      const rawStatus = String(data?.status ?? '').toLowerCase();
      const status    = this._mapStatus(rawStatus);

      return {
        transactionId,
        status,
        gatewayRef: data.order_id ?? data.id ?? transactionId,
        amount:     parseFloat(String(data?.amount ?? data?.total ?? '0')),
        paidAt:     status === 'approved' ? new Date(data.paid_at ?? Date.now()) : undefined,
      };
    } catch (err: any) {
      return { transactionId, status: 'error', error: err?.message };
    }
  }

  // ─── Webhook ──────────────────────────────────────────────────────────────────

  async handleWebhook(
    headers: Record<string, string>,
    body: Record<string, unknown>,
  ): Promise<WebhookResult> {
    // Verificar firma HMAC
    if (this.secretKey) {
      const signature = headers['x-deuna-signature'] ?? headers['x-signature'] ?? '';
      const computed  = crypto
        .createHmac('sha256', this.secretKey)
        .update(JSON.stringify(body))
        .digest('hex');

      if (signature && signature !== computed) {
        this.logger.error('Firma de webhook DEUNA inválida');
        throw new Error('Webhook signature mismatch');
      }
    }

    const transactionId = String(body.order_id ?? body.merchant_reference ?? body.transactionId ?? '');
    const rawStatus     = String((body.status ?? body.event ?? '')).toLowerCase();
    const status        = this._mapStatus(rawStatus);

    this.logger.log(`Webhook DEUNA: txn=${transactionId} status=${status}`);
    return { transactionId, status, gatewayRef: String(body.order_id ?? ''), raw: body };
  }

  // ─── Helpers privados ─────────────────────────────────────────────────────────

  private async _createOrder(params: {
    orderId:     string;
    rideId:      string;
    userId:      string;
    amountUsd:   number;
    description: string;
    callbackUrl: string;
  }): Promise<{ orderId: string; qrCodeUrl: string; paymentLink: string }> {
    const body = {
      order_id:           params.orderId,
      amount:             params.amountUsd.toFixed(2),
      currency:           'USD',
      description:        params.description,
      store_code:         this.storeCode,
      customer_reference: params.userId,
      metadata: {
        ride_id: params.rideId,
        source:  'going-transport',
      },
      callback_url: params.callbackUrl,
    };

    const res  = await this._post('/v1/orders', body);
    const data = await res.json() as Record<string, any>;

    if (!res.ok) {
      throw new Error(`DEUNA API ${res.status}: ${data?.message ?? JSON.stringify(data)}`);
    }

    return {
      orderId:     data.order_id  ?? params.orderId,
      qrCodeUrl:   data.qr_url   ?? data.qr_code_url ?? '',
      paymentLink: data.payment_link ?? data.link ?? '',
    };
  }

  private _mapStatus(rawStatus: string): PaymentStatus {
    switch (rawStatus) {
      case 'completed':
      case 'paid':
      case 'approved':
      case 'success':
        return 'approved';
      case 'pending':
      case 'created':
      case 'waiting':
        return 'processing';
      case 'failed':
      case 'rejected':
      case 'cancelled':
      case 'expired':
        return 'rejected';
      default:
        return 'pending';
    }
  }

  private _post(path: string, body: unknown) {
    return fetch(`${this.baseUrl}${path}`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'X-Store-Code':  this.storeCode,
      },
      body: JSON.stringify(body),
    });
  }

  private _get(path: string) {
    return fetch(`${this.baseUrl}${path}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'X-Store-Code':  this.storeCode,
      },
    });
  }
}
