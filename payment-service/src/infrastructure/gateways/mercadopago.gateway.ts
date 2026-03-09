import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Result, ok, err } from 'neverthrow';
import {
  IPaymentGateway,
  PaymentIntentResult,
} from '@going-monorepo-clean/domains-payment-core';
import { Money } from '@going-monorepo-clean/shared-domain';

// MercadoPago SDK v2 — install: pnpm add mercadopago
import MercadoPago, { Payment, Preference } from 'mercadopago';

@Injectable()
export class MercadoPagoGateway implements IPaymentGateway {
  private readonly client: MercadoPago;
  private readonly payment: Payment;
  private readonly preference: Preference;
  private readonly logger = new Logger(MercadoPagoGateway.name);

  /** Currency → country mapping for LATAM coverage */
  private static readonly CURRENCY_MAP: Record<string, string> = {
    ARS: 'AR', // Argentina
    BRL: 'BR', // Brazil
    CLP: 'CL', // Chile
    COP: 'CO', // Colombia
    MXN: 'MX', // Mexico
    PEN: 'PE', // Peru
    UYU: 'UY', // Uruguay
    USD: 'US', // USD fallback
  };

  constructor(private readonly configService: ConfigService) {
    const accessToken = this.configService.get<string>(
      'MERCADOPAGO_ACCESS_TOKEN'
    );

    if (!accessToken) {
      this.logger.warn(
        'MERCADOPAGO_ACCESS_TOKEN not configured – MP payments will be unavailable'
      );
      return;
    }

    this.client = new MercadoPago({ accessToken });
    this.payment = new Payment(this.client);
    this.preference = new Preference(this.client);
    this.logger.log('MercadoPago gateway initialized');
  }

  /**
   * Creates a MercadoPago Payment Intent compatible with the IPaymentGateway interface.
   * Returns a clientSecret-compatible init_point URL for the mobile SDK.
   */
  async createPaymentIntent(
    amount: Money
  ): Promise<Result<PaymentIntentResult, Error>> {
    if (!this.payment) {
      return err(
        new Error(
          'MercadoPago not configured: missing MERCADOPAGO_ACCESS_TOKEN'
        )
      );
    }

    try {
      const siteId = MercadoPagoGateway.CURRENCY_MAP[amount.currency] ?? 'AR';

      const pref = await this.preference.create({
        body: {
          items: [
            {
              id: `going-payment-${Date.now()}`,
              title: 'Going – Servicio',
              quantity: 1,
              unit_price: amount.amount / 100, // MP works in decimals, not cents
              currency_id: amount.currency,
            },
          ],
          payment_methods: {
            excluded_payment_types: [],
            installments: 1,
          },
          binary_mode: true, // approve or reject — no pending
          statement_descriptor: 'GOING',
          external_reference: `going-${Date.now()}`,
        },
      });

      if (!pref.init_point) {
        return err(new Error('MercadoPago did not return an init_point'));
      }

      return ok({
        // init_point is the checkout URL — used as clientSecret for mobile SDK
        clientSecret: pref.init_point,
        paymentIntentId: pref.id ?? `mp-${Date.now()}`,
      });
    } catch (error: any) {
      this.logger.error(
        `MercadoPago createPaymentIntent error: ${error.message}`
      );
      return err(new Error(error.message));
    }
  }

  /**
   * Verifies a MercadoPago webhook notification.
   * MP uses HMAC-SHA256 on `x-signature` header.
   */
  async constructWebhookEvent(
    payload: Buffer,
    signature: string
  ): Promise<Result<any, Error>> {
    try {
      const secret = this.configService.get<string>(
        'MERCADOPAGO_WEBHOOK_SECRET'
      );
      if (!secret) {
        return err(new Error('MERCADOPAGO_WEBHOOK_SECRET not configured'));
      }

      const crypto = await import('crypto');
      const [, ts] = signature.split(',v1=');
      const [tsPart] = signature.split(',');
      const timestamp = tsPart.replace('ts=', '');
      const manifest = `id:;request-id:;ts:${timestamp};`;
      const expectedSig = crypto
        .createHmac('sha256', secret)
        .update(manifest)
        .digest('hex');

      if (expectedSig !== ts) {
        return err(new Error('MercadoPago webhook signature mismatch'));
      }

      return ok(JSON.parse(payload.toString('utf-8')));
    } catch (error: any) {
      this.logger.error(`MP webhook verification failed: ${error.message}`);
      return err(new Error(`Webhook Error: ${error.message}`));
    }
  }

  /**
   * Get payment status by MP payment ID.
   */
  async getPaymentStatus(paymentId: string): Promise<Result<string, Error>> {
    if (!this.payment) {
      return err(new Error('MercadoPago not initialized'));
    }
    try {
      const result = await this.payment.get({ id: Number(paymentId) });
      return ok(result.status ?? 'unknown');
    } catch (error: any) {
      return err(new Error(error.message));
    }
  }
}
