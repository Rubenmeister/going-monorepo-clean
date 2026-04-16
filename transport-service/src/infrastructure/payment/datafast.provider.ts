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
 * DatafastProvider — Integración con DATAFAST Ecuador.
 *
 * DATAFAST usa el estándar OPPWA (Open Payment Platform):
 *  - Cobro inmediato:  paymentType = "DB"  (Debit)
 *  - Pre-autorización: paymentType = "PA"  (Pre-Authorization)  ← al iniciar viaje
 *  - Captura:          paymentType = "CP"  (Capture)            ← al terminar viaje
 *  - Reverso de PA:    paymentType = "RV"  (Reversal)           ← si se cancela
 *
 * Variables de entorno requeridas:
 *   DATAFAST_ENTITY_ID       — Entity ID asignado por DATAFAST (reemplaza merchantId+terminalId)
 *   DATAFAST_API_KEY          — Bearer token / Access Token
 *   DATAFAST_API_URL          — URL base (sandbox o producción)
 *   DATAFAST_CHECKOUT_JS_URL  — URL del JS SDK para modo lightbox
 *   DATAFAST_MODE             — 'redirect' | 'lightbox' | 'direct_api' (default: redirect)
 *   DATAFAST_WEBHOOK_SECRET   — Secret para verificar firma de webhook
 *
 * Sandbox:     https://eu-test.oppwa.com  (OPPWA sandbox global)
 *              https://ccapi-test.datafast.com.ec (sandbox Datafast Ecuador)
 * Producción:  https://ccapi.datafast.com.ec
 */
@Injectable()
export class DatafastProvider implements IPaymentGateway {
  readonly name = 'datafast';
  readonly defaultMode: PaymentMode;

  private readonly logger        = new Logger(DatafastProvider.name);
  private readonly baseUrl:      string;
  private readonly entityId:     string;
  private readonly apiKey:       string;
  private readonly webhookSecret: string;
  private readonly checkoutJsUrl: string;

  constructor(private readonly config: ConfigService) {
    this.baseUrl        = config.get('DATAFAST_API_URL', 'https://ccapi-test.datafast.com.ec');
    this.entityId       = config.get('DATAFAST_ENTITY_ID', '');
    this.apiKey         = config.get('DATAFAST_API_KEY', '');
    this.webhookSecret  = config.get('DATAFAST_WEBHOOK_SECRET', '');
    this.checkoutJsUrl  = config.get(
      'DATAFAST_CHECKOUT_JS_URL',
      'https://ccapi-test.datafast.com.ec/v1/paymentWidgets.js',
    );
    this.defaultMode = config.get('DATAFAST_MODE', 'redirect') as PaymentMode;

    if (!this.entityId || !this.apiKey) {
      this.logger.warn('DATAFAST no configurado — verifica DATAFAST_ENTITY_ID y DATAFAST_API_KEY');
    } else {
      this.logger.log(`DATAFAST habilitado · modo=${this.defaultMode} · url=${this.baseUrl}`);
    }
  }

  // ─── Checkout (pago inmediato one-shot) ───────────────────────────────────────

  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    switch (this.defaultMode) {
      case 'lightbox':   return this._initiateLightbox(input);
      case 'direct_api': return this._initiateDirectApi(input);
      default:           return this._initiateRedirect(input);
    }
  }

  /**
   * Crea un checkout en Datafast (Fase 2 — todos los campos obligatorios).
   * Retorna el checkoutId para renderizar el widget en WebView.
   *
   * Flujo móvil:
   *  1. Backend llama a este método → obtiene checkoutId
   *  2. App abre WebView con el script del widget
   *  3. Usuario paga → widget redirige a shopperResultUrl con ?resourcePath=
   *  4. Backend llama a getStatusByResourcePath(resourcePath) para confirmar
   */
  private async _initiateRedirect(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    const isTest = !this.baseUrl.includes('ccapi.datafast') ||
                   this.config.get('NODE_ENV') !== 'production';

    // ── IVA Ecuador: 15% sobre la base imponible ────────────────────────────
    // Los viajes de transporte no gravan IVA en Ecuador (exentos Art. 56 LRTI)
    // Si el servicio es exento: BASEIMP=0, IVA=0, BASE0=amount
    const baseImp = input.taxableAmount ?? 0;
    const ivaRate = 0.15;
    const ivaVal  = +(baseImp * ivaRate).toFixed(2);
    const base0   = +(input.amountUsd - baseImp - ivaVal).toFixed(2);

    // ── merchantTransactionId: único por transacción, 8-255 caracteres ──────
    const merchantTxId = input.transactionId.length >= 8
      ? input.transactionId.slice(0, 255)
      : input.transactionId.padEnd(8, '0');

    // ── Cédula: siempre 10 dígitos, completar con ceros a la izquierda ──────
    const docId = (input.customerDocId ?? '0000000000').padStart(10, '0').slice(0, 10);

    const params: Record<string, string> = {
      // ── Identificación ───────────────────────────────────────────────────
      'entityId':                      this.entityId,
      'amount':                        input.amountUsd.toFixed(2),
      'currency':                      'USD',
      'paymentType':                   'DB',
      'merchantTransactionId':         merchantTxId,

      // ── Cliente ──────────────────────────────────────────────────────────
      'customer.givenName':            (input.customerFirstName ?? 'Cliente').slice(0, 48),
      'customer.middleName':           (input.customerMiddleName ?? 'G').slice(0, 50),
      'customer.surname':              (input.customerLastName ?? 'Going').slice(0, 48),
      'customer.email':                (input.customerEmail ?? 'cliente@goingec.com').slice(0, 128),
      'customer.phone':                (input.customerPhone ?? '0999999999').slice(0, 25),
      'customer.ip':                   (input.customerIp ?? '127.0.0.1').slice(0, 255),
      'customer.merchantCustomerId':   (input.userId ?? 'GUEST').slice(0, 16),
      'customer.identificationDocType': 'IDCARD',
      'customer.identificationDocId':  docId,

      // ── Producto (viaje Going) ────────────────────────────────────────────
      'cart.items[0].name':            (input.description ?? 'Viaje Going').slice(0, 255),
      'cart.items[0].description':     (input.description ?? 'Servicio de transporte Going Ecuador').slice(0, 255),
      'cart.items[0].price':           input.amountUsd.toFixed(2),
      'cart.items[0].quantity':        '1',

      // ── Dirección ────────────────────────────────────────────────────────
      'billing.street1':               (input.billingAddress ?? 'Quito, Ecuador').slice(0, 100),
      'billing.country':               'EC',
      'shipping.street1':              (input.shippingAddress ?? input.billingAddress ?? 'Quito, Ecuador').slice(0, 100),
      'shipping.country':              'EC',

      // ── Redirect ─────────────────────────────────────────────────────────
      'shopperResultUrl':              input.returnUrl ?? `${this.config.get('APP_URL', 'https://api.goingec.com')}/payments/datafast/return`,

      // ── Impuestos Ecuador (exención IVA para transporte) ─────────────────
      'customParameters[SHOPPER_VAL_BASE0]':   base0.toFixed(2),
      'customParameters[SHOPPER_VAL_BASEIMP]': baseImp.toFixed(2),
      'customParameters[SHOPPER_VAL_IVA]':     ivaVal.toFixed(2),

      // ── Identificadores Datafast ──────────────────────────────────────────
      'customParameters[SHOPPER_MID]': this.config.get('DATAFAST_MID', '1000000406'),
      'customParameters[SHOPPER_TID]': this.config.get('DATAFAST_TID', 'PD100406'),
      'customParameters[SHOPPER_ECI]': '0103910',
    };

    // En ambiente de prueba (Fase 2) agregar textMode
    if (isTest) {
      params['testMode'] = 'EXTERNAL';
    }

    const res  = await this._postForm('/v1/checkouts', new URLSearchParams(params));
    const data = await res.json() as Record<string, any>;

    if (!res.ok || !this._isSuccess(data)) {
      this.logger.error(`DATAFAST checkout error: ${JSON.stringify(data?.result)}`);
      throw new Error(`DATAFAST ${res.status}: ${data?.result?.description ?? 'error iniciando checkout'}`);
    }

    const checkoutId  = data.id as string;
    const widgetJsUrl = `${this.baseUrl}/v1/paymentWidgets.js?checkoutId=${checkoutId}`;

    this.logger.log(`DATAFAST checkout creado: id=${checkoutId} monto=${input.amountUsd}`);

    return {
      mode:          'redirect',
      transactionId: input.transactionId,
      gatewayRef:    checkoutId,
      // URL del widget JS para cargar en WebView
      redirectUrl:   widgetJsUrl,
      // HTML mínimo para el WebView
      checkoutHtml:  this._buildCheckoutHtml(widgetJsUrl, input.returnUrl ?? ''),
    };
  }

  /**
   * Genera el HTML mínimo para cargar el widget Datafast en un WebView móvil.
   * El form se auto-envía al shopperResultUrl tras el pago.
   */
  private _buildCheckoutHtml(widgetJsUrl: string, shopperResultUrl: string): string {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://www.datafast.com.ec/js/dfAdditionalValidations1.js"></script>
</head>
<body style="margin:0;padding:16px;background:#f0f2f5;font-family:sans-serif;">
  <script src="${widgetJsUrl}"></script>
  <form action="${shopperResultUrl}"
        class="paymentWidgets"
        data-brands="VISA MASTER AMEX DINERS DISCOVER">
  </form>
</body>
</html>`;
  }

  /**
   * Verifica el estado de una transacción usando el resourcePath
   * que Datafast envía como parámetro al shopperResultUrl.
   * resourcePath ejemplo: /v1/checkouts/{checkoutId}/payment
   */
  async getStatusByResourcePath(resourcePath: string): Promise<PaymentStatusResult> {
    const url  = `${this.baseUrl}${resourcePath}?entityId=${this.entityId}`;
    const res  = await this._get(url);
    const data = await res.json() as Record<string, any>;

    const approved = this._isApproved(data);
    const txnId    = data?.merchantTransactionId ?? data?.id ?? '';

    this.logger.log(`DATAFAST resourcePath status: code=${data?.result?.code} approved=${approved}`);

    return {
      transactionId: txnId,
      status:        approved ? 'approved' : 'rejected',
      gatewayRef:    data?.id ?? '',
      amount:        parseFloat(data?.amount ?? '0'),
      paidAt:        approved ? new Date(data?.timestamp ?? Date.now()) : undefined,
      raw:           data,
    };
  }

  private async _initiateLightbox(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    const result = await this._initiateRedirect(input);
    const token  = result.redirectUrl?.split('checkoutId=')[1] ?? '';
    return { mode: 'lightbox', transactionId: input.transactionId, token, checkoutJsUrl: this.checkoutJsUrl };
  }

  private async _initiateDirectApi(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    if (!input.cardDetails) throw new Error('cardDetails requerido para modo direct_api');
    const { number, expiryMonth, expiryYear, cvv, holderName } = input.cardDetails;

    const body = new URLSearchParams({
      'entityId':              this.entityId,
      'amount':                input.amountUsd.toFixed(2),
      'currency':              'USD',
      'paymentType':           'DB',
      'card.number':           number.replace(/\s/g, ''),
      'card.holder':           holderName,
      'card.expiryMonth':      expiryMonth,
      'card.expiryYear':       expiryYear,
      'card.cvv':              cvv,
      'merchantTransactionId': input.transactionId,
    });

    const res  = await this._postForm('/v1/payments', body);
    const data = await res.json() as Record<string, any>;
    const approved = res.ok && this._isApproved(data);

    return {
      mode:          'direct_api',
      transactionId: input.transactionId,
      status:        approved ? 'approved' : 'rejected',
      gatewayRef:    data?.id,
    };
  }

  // ─── Pre-autorización (PA) — al iniciar el viaje ──────────────────────────────

  async authorize(input: AuthorizeInput): Promise<AuthorizeResult> {
    const params: Record<string, string> = {
      'entityId':              this.entityId,
      'amount':                input.amountUsd.toFixed(2),
      'currency':              'USD',
      'paymentType':           'PA',
      'merchantTransactionId': input.transactionId,
      'descriptor':            input.description,
      'customer.merchantCustomerId': input.userId,
    };

    // Pago con token de tarjeta registrada (modo recomendado — sin PCI)
    if (input.cardToken) {
      params['recurringType']             = 'REPEATED';
      params['registrations[0].id']       = input.cardToken;
    } else if (input.cardDetails) {
      const c = input.cardDetails;
      params['card.number']      = c.number.replace(/\s/g, '');
      params['card.holder']      = c.holderName;
      params['card.expiryMonth'] = c.expiryMonth;
      params['card.expiryYear']  = c.expiryYear;
      params['card.cvv']         = c.cvv;
    } else {
      // Sin datos de tarjeta — retorna error
      return {
        transactionId: input.transactionId,
        gatewayRef:    '',
        status:        'rejected',
        error:         'Se requiere cardToken o cardDetails para pre-autorización',
      };
    }

    const res  = await this._postForm('/v1/payments', new URLSearchParams(params));
    const data = await res.json() as Record<string, any>;

    if (!res.ok || !this._isApproved(data)) {
      this.logger.warn(`DATAFAST PA rechazado: ${JSON.stringify(data?.result)}`);
      return {
        transactionId: input.transactionId,
        gatewayRef:    data?.id ?? '',
        status:        'rejected',
        error:         data?.result?.description ?? 'Pre-autorización rechazada',
      };
    }

    this.logger.log(`DATAFAST PA aprobada: ref=${data.id} monto=${input.amountUsd}`);
    return {
      transactionId: input.transactionId,
      gatewayRef:    data.id,        // ← Guardar en BD para el capture posterior
      status:        'authorized',
    };
  }

  // ─── Captura (CP) — al terminar el viaje ─────────────────────────────────────

  async capture(input: CaptureInput): Promise<CaptureResult> {
    const body = new URLSearchParams({
      'entityId':              this.entityId,
      'amount':                input.amountUsd.toFixed(2),
      'currency':              'USD',
      'paymentType':           'CP',
      'merchantTransactionId': `${input.transactionId}_cap`,
    });

    // El capture se hace como POST al endpoint del pago original
    const res  = await this._postForm(`/v1/payments/${input.gatewayRef}`, body);
    const data = await res.json() as Record<string, any>;

    if (!res.ok || !this._isApproved(data)) {
      this.logger.error(`DATAFAST CP fallido: ${JSON.stringify(data?.result)}`);
      return {
        transactionId: input.transactionId,
        gatewayRef:    input.gatewayRef,
        status:        'rejected',
        chargedAmount: 0,
        error:         data?.result?.description ?? 'Capture fallido',
      };
    }

    this.logger.log(`DATAFAST CP exitoso: ref=${data.id} monto=${input.amountUsd}`);
    return {
      transactionId: input.transactionId,
      gatewayRef:    data.id ?? input.gatewayRef,
      status:        'approved',
      chargedAmount: input.amountUsd,
    };
  }

  // ─── Status ───────────────────────────────────────────────────────────────────

  async getStatus(transactionId: string): Promise<PaymentStatusResult> {
    const res  = await this._get(`/v1/payments?entityId=${this.entityId}&merchantTransactionId=${transactionId}`);
    const data = await res.json() as Record<string, any>;

    if (!res.ok) {
      return { transactionId, status: 'error', error: data?.result?.description };
    }

    const approved = this._isApproved(data);
    return {
      transactionId,
      status:     approved ? 'approved' : data?.status === 'pending' ? 'processing' : 'rejected',
      gatewayRef: data.id,
      amount:     parseFloat(data?.amount ?? '0'),
      paidAt:     approved ? new Date(data.timestamp ?? Date.now()) : undefined,
    };
  }

  // ─── Webhook ──────────────────────────────────────────────────────────────────

  async handleWebhook(
    headers: Record<string, string>,
    body: Record<string, unknown>,
  ): Promise<WebhookResult> {
    if (this.webhookSecret) {
      const signature = headers['x-datafast-signature'] ?? headers['x-signature'] ?? '';
      const computed  = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(JSON.stringify(body))
        .digest('hex');

      if (signature !== computed) {
        this.logger.error('Firma de webhook DATAFAST inválida');
        throw new Error('Webhook signature mismatch');
      }
    }

    const transactionId = String(body.merchantTransactionId ?? body.transactionId ?? '');
    const approved      = this._isApproved(body as Record<string, any>);
    const status: PaymentStatus = approved ? 'approved' : 'rejected';

    this.logger.log(`Webhook DATAFAST: txn=${transactionId} status=${status}`);
    return { transactionId, status, gatewayRef: String(body.id ?? ''), raw: body };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  /** Códigos de éxito OPPWA: 000.000.xxx = éxito, 000.100.1xx = éxito (3DS) */
  private _isApproved(data: Record<string, any>): boolean {
    const code = String(data?.result?.code ?? '');
    return code.startsWith('000.000') || code.startsWith('000.100');
  }

  /** Códigos de éxito para checkouts (pendiente de pago) */
  private _isSuccess(data: Record<string, any>): boolean {
    const code = String(data?.result?.code ?? '');
    // 000.200.100 = checkout creado exitosamente
    return code.startsWith('000.2') || this._isApproved(data);
  }

  private _postForm(path: string, body: URLSearchParams) {
    return fetch(`${this.baseUrl}${path}`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: body.toString(),
    });
  }

  private _get(path: string) {
    return fetch(`${this.baseUrl}${path}`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` },
    });
  }
}
