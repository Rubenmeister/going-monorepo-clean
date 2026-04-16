import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Result, ok, err } from 'neverthrow';
import {
  IPaymentGateway,
  PaymentIntentResult,
} from '@going-monorepo-clean/domains-payment-core';
import { Money } from '@going-monorepo-clean/shared-domain';
import * as crypto from 'crypto';

/**
 * Datafast Gateway — Flujo mSDK (Dataweb Token Standalone)
 * Documentación: https://developers.datafast.com.ec/msdk.aspx
 *
 * ──────────────────────────────────────────────────────
 * FLUJO COMPLETO (4 pasos según diagrama Datafast):
 *
 * [Paso 1] Backend genera CheckoutID via OPPWA
 *   APP → API (createPaymentIntent) → OPPWA → checkoutId → APP
 *
 * [Paso 2] App usa mSDK para tokenizar tarjeta
 *   APP envía checkoutId al mSDK nativo (React Native module)
 *   mSDK ↔ OPPWA tokeniza la tarjeta
 *   mSDK retorna control a la APP con resultado
 *
 * [Paso 3] APP consulta estado/token a backend
 *   APP → API (getPaymentStatus) → OPPWA → { status, token } → APP
 *   ⚠️ El token es de un solo uso
 *
 * [Paso 4] Backend ejecuta la transacción con el token
 *   APP → API (executeTransaction) → OPPWA → Datafast → Banco → resultado
 *
 * ⚠️  Este flujo requiere aprobación previa de Datafast
 * ──────────────────────────────────────────────────────
 *
 * Variables de entorno requeridas:
 *   DATAFAST_ENTITY_ID      → Entity ID asignado por Datafast/OPPWA
 *   DATAFAST_ACCESS_TOKEN   → Bearer token de acceso OPPWA
 *   DATAFAST_WEBHOOK_SECRET → Secret HMAC-SHA256 para verificar notificaciones
 *   DATAFAST_OPPWA_URL      → https://eu-prod.oppwa.com (producción)
 *                             https://eu-test.oppwa.com  (sandbox)
 */
@Injectable()
export class DatafastGateway implements IPaymentGateway {
  private readonly logger = new Logger(DatafastGateway.name);
  private readonly oppwaUrl: string;
  private readonly entityId: string;
  private readonly accessToken: string;
  private readonly webhookSecret: string;
  private readonly isConfigured: boolean;

  constructor(private readonly configService: ConfigService) {
    this.entityId = this.configService.get<string>('DATAFAST_ENTITY_ID') ?? '';
    this.accessToken = this.configService.get<string>('DATAFAST_ACCESS_TOKEN') ?? '';
    this.webhookSecret = this.configService.get<string>('DATAFAST_WEBHOOK_SECRET') ?? '';
    this.oppwaUrl =
      this.configService.get<string>('DATAFAST_OPPWA_URL') ??
      'https://eu-test.oppwa.com'; // sandbox por defecto

    this.isConfigured = !!(this.entityId && this.accessToken);

    if (!this.isConfigured) {
      this.logger.warn(
        'DATAFAST_ENTITY_ID o DATAFAST_ACCESS_TOKEN no configurados – pagos Datafast no disponibles'
      );
    } else {
      this.logger.log(`Datafast/OPPWA gateway inicializado → ${this.oppwaUrl}`);
    }
  }

  /**
   * PASO 1: Genera un CheckoutID en OPPWA.
   *
   * El checkoutId retornado (como clientSecret) es enviado a la app
   * para que el mSDK lo use en el Paso 2 (tokenización en dispositivo).
   *
   * POST /v1/checkouts
   */
  async createPaymentIntent(
    amount: Money
  ): Promise<Result<PaymentIntentResult, Error>> {
    if (!this.isConfigured) {
      return err(
        new Error('Datafast no configurado: faltan DATAFAST_ENTITY_ID o DATAFAST_ACCESS_TOKEN')
      );
    }

    try {
      const params = new URLSearchParams({
        'authentication.entityId': this.entityId,
        amount: (amount.amount / 100).toFixed(2), // USD en decimales
        currency: amount.currency || 'USD',
        paymentType: 'DB', // DB = Debit (cobro directo)
        'merchantTransactionId': `going-${Date.now()}`,
        'descriptor': 'Going Transporte',
      });

      const response = await fetch(`${this.oppwaUrl}/v1/checkouts`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`OPPWA error ${response.status}: ${errorText}`);
        return err(new Error(`OPPWA rechazó la solicitud: ${response.status}`));
      }

      const data = (await response.json()) as {
        id: string;
        result: { code: string; description: string };
      };

      // OPPWA retorna código de éxito en formato "000.200.100" o "000.200.101"
      const isSuccess = /^(000\.200)/.test(data.result?.code ?? '');
      if (!isSuccess) {
        return err(
          new Error(`OPPWA error: ${data.result?.code} – ${data.result?.description}`)
        );
      }

      this.logger.log(`CheckoutID generado: ${data.id}`);

      return ok({
        // clientSecret = checkoutId que el mSDK de React Native consume
        clientSecret: data.id,
        paymentIntentId: data.id,
      });
    } catch (error: any) {
      this.logger.error(`Datafast createPaymentIntent error: ${error.message}`);
      return err(new Error(error.message));
    }
  }

  /**
   * PASO 3: Consulta estado de la transacción y obtiene el token de pago.
   * ⚠️ El token retornado es de un solo uso.
   *
   * GET /v1/checkouts/:checkoutId/payment
   */
  async getPaymentStatus(checkoutId: string): Promise<Result<string, Error>> {
    if (!this.isConfigured) {
      return err(new Error('Datafast no inicializado'));
    }

    try {
      const url = new URL(`${this.oppwaUrl}/v1/checkouts/${checkoutId}/payment`);
      url.searchParams.set('authentication.entityId', this.entityId);

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        return err(new Error(`OPPWA status error: ${response.status}`));
      }

      const data = (await response.json()) as {
        result: { code: string; description: string };
        id: string;
      };

      // Códigos de éxito OPPWA: 000.000.000 (aprobado) / 000.100.xxx (aprobado banco)
      const approved = /^(000\.000\.|000\.100\.)/.test(data.result?.code ?? '');
      const status = approved ? 'approved' : `rejected:${data.result?.code}`;

      this.logger.log(`Transacción ${checkoutId} → ${status}`);
      return ok(status);
    } catch (error: any) {
      return err(new Error(error.message));
    }
  }

  /**
   * PASO 4: Ejecuta una transacción con el token obtenido en Paso 3.
   * Llamar solo después de confirmar que getPaymentStatus retornó 'approved'.
   *
   * POST /v1/registrations/:token/payments
   */
  async executeWithToken(
    token: string,
    amount: Money
  ): Promise<Result<{ transactionId: string; status: string }, Error>> {
    if (!this.isConfigured) {
      return err(new Error('Datafast no inicializado'));
    }

    try {
      const params = new URLSearchParams({
        'authentication.entityId': this.entityId,
        amount: (amount.amount / 100).toFixed(2),
        currency: amount.currency || 'USD',
        paymentType: 'DB',
      });

      const response = await fetch(
        `${this.oppwaUrl}/v1/registrations/${token}/payments`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        }
      );

      if (!response.ok) {
        return err(new Error(`OPPWA executeWithToken error: ${response.status}`));
      }

      const data = (await response.json()) as {
        id: string;
        result: { code: string; description: string };
      };

      const approved = /^(000\.000\.|000\.100\.)/.test(data.result?.code ?? '');
      return ok({
        transactionId: data.id,
        status: approved ? 'approved' : 'rejected',
      });
    } catch (error: any) {
      return err(new Error(error.message));
    }
  }

  /**
   * Verifica la firma HMAC-SHA256 de notificaciones de Datafast/OPPWA.
   */
  async constructWebhookEvent(
    payload: Buffer,
    signature: string
  ): Promise<Result<any, Error>> {
    try {
      if (!this.webhookSecret) {
        return err(new Error('DATAFAST_WEBHOOK_SECRET no configurado'));
      }

      const expectedSig = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(payload)
        .digest('hex');

      if (expectedSig !== signature) {
        return err(new Error('Datafast webhook: firma inválida'));
      }

      return ok(JSON.parse(payload.toString('utf-8')));
    } catch (error: any) {
      this.logger.error(`Datafast webhook verification failed: ${error.message}`);
      return err(new Error(`Webhook Error: ${error.message}`));
    }
  }
}
