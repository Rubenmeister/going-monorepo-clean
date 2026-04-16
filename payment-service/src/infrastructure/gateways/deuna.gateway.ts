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
 * DeUna Gateway — Pagos digitales Ecuador
 * Documentación: https://www.deuna.ec/negocios/empresas.html
 *
 * DeUna permite cobros via:
 *   - QR dinámico (el usuario escanea con su app DeUna o banco afiliado)
 *   - Link de pago (se envía al usuario por WhatsApp/SMS)
 *   - Código único de 6 dígitos
 *
 * Variables de entorno requeridas:
 *   DEUNA_API_KEY          → API Key asignada por DeUna
 *   DEUNA_MERCHANT_ID      → ID de comercio DeUna
 *   DEUNA_WEBHOOK_SECRET   → Secret para verificar webhooks
 *   DEUNA_API_URL          → https://api.deuna.ec (producción)
 *                            https://sandbox.api.deuna.ec (pruebas)
 */
@Injectable()
export class DeunaGateway implements IPaymentGateway {
  private readonly logger = new Logger(DeunaGateway.name);
  private readonly apiUrl: string;
  private readonly merchantId: string;
  private readonly apiKey: string;
  private readonly webhookSecret: string;
  private readonly isConfigured: boolean;

  constructor(private readonly configService: ConfigService) {
    this.merchantId = this.configService.get<string>('DEUNA_MERCHANT_ID') ?? '';
    this.apiKey = this.configService.get<string>('DEUNA_API_KEY') ?? '';
    this.webhookSecret = this.configService.get<string>('DEUNA_WEBHOOK_SECRET') ?? '';
    this.apiUrl =
      this.configService.get<string>('DEUNA_API_URL') ??
      'https://sandbox.api.deuna.ec';

    this.isConfigured = !!(this.merchantId && this.apiKey);

    if (!this.isConfigured) {
      this.logger.warn(
        'DEUNA_MERCHANT_ID o DEUNA_API_KEY no configurados – pagos DeUna no disponibles'
      );
    } else {
      this.logger.log(`DeUna gateway inicializado → ${this.apiUrl}`);
    }
  }

  /**
   * Crea una orden de pago en DeUna.
   * Retorna el link de pago (clientSecret) que se puede:
   *   - Abrir en WebView dentro de la app Going
   *   - Enviar al usuario por WhatsApp / SMS
   *   - Convertir a QR para mostrar en pantalla
   *
   * Flujo:
   *   1. POST /v1/orders  → DeUna retorna { orderId, paymentLink, qrCode }
   *   2. App muestra el QR o abre el paymentLink
   *   3. Usuario paga desde su app DeUna / banco afiliado
   *   4. DeUna confirma via webhook con { orderId, status: 'paid' }
   */
  async createPaymentIntent(
    amount: Money
  ): Promise<Result<PaymentIntentResult, Error>> {
    if (!this.isConfigured) {
      return err(
        new Error('DeUna no configurado: faltan DEUNA_MERCHANT_ID o DEUNA_API_KEY')
      );
    }

    try {
      const orderId = `going-${Date.now()}`;

      const body = {
        merchantId: this.merchantId,
        orderId,
        amount: amount.amount / 100, // DeUna trabaja en decimales (USD)
        currency: amount.currency || 'USD',
        description: 'Going – Servicio de transporte',
        // Webhook que DeUna llamará al confirmar el pago
        callbackUrl: 'https://api.goingec.com/webhooks/deuna',
        // Opcional: redirigir al usuario después del pago
        redirectUrl: 'https://api.goingec.com/payments/success',
        expiresIn: 900, // 15 minutos en segundos
      };

      const response = await fetch(`${this.apiUrl}/v1/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': this.apiKey,
          'X-Merchant-ID': this.merchantId,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`DeUna error ${response.status}: ${errorText}`);
        return err(new Error(`DeUna rechazó la solicitud: ${response.status}`));
      }

      const data = (await response.json()) as {
        orderId: string;
        paymentLink: string;
        qrCode?: string;
        uniqueCode?: string;
      };

      if (!data.paymentLink) {
        return err(new Error('DeUna no retornó paymentLink'));
      }

      this.logger.log(`Orden DeUna creada: ${data.orderId}`);

      return ok({
        // paymentLink es la URL que se abre en WebView o se comparte al usuario
        clientSecret: data.paymentLink,
        paymentIntentId: data.orderId,
        // metadata adicional disponible en el resultado
        ...(data.qrCode && { qrCode: data.qrCode }),
        ...(data.uniqueCode && { uniqueCode: data.uniqueCode }),
      });
    } catch (error: any) {
      this.logger.error(`DeUna createPaymentIntent error: ${error.message}`);
      return err(new Error(error.message));
    }
  }

  /**
   * Verifica la firma HMAC-SHA256 del webhook de DeUna.
   * DeUna envía la firma en el header: X-DeUna-Signature
   */
  async constructWebhookEvent(
    payload: Buffer,
    signature: string
  ): Promise<Result<any, Error>> {
    try {
      if (!this.webhookSecret) {
        return err(new Error('DEUNA_WEBHOOK_SECRET no configurado'));
      }

      const expectedSig = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(payload)
        .digest('hex');

      if (expectedSig !== signature) {
        return err(new Error('DeUna webhook: firma inválida'));
      }

      return ok(JSON.parse(payload.toString('utf-8')));
    } catch (error: any) {
      this.logger.error(`DeUna webhook verification failed: ${error.message}`);
      return err(new Error(`Webhook Error: ${error.message}`));
    }
  }

  /**
   * Consulta el estado de una orden en DeUna.
   * GET /v1/orders/:orderId
   *
   * Estados posibles: pending | paid | expired | cancelled
   */
  async getPaymentStatus(orderId: string): Promise<Result<string, Error>> {
    if (!this.isConfigured) {
      return err(new Error('DeUna no inicializado'));
    }

    try {
      const response = await fetch(`${this.apiUrl}/v1/orders/${orderId}`, {
        headers: {
          'X-Api-Key': this.apiKey,
          'X-Merchant-ID': this.merchantId,
        },
      });

      if (!response.ok) {
        return err(new Error(`DeUna status error: ${response.status}`));
      }

      const data = (await response.json()) as { status: string };
      return ok(data.status ?? 'unknown');
    } catch (error: any) {
      return err(new Error(error.message));
    }
  }
}
