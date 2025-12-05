import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

export interface PaymentIntentResult {
  clientSecret: string;
  paymentIntentId: string;
}

@Injectable()
export class StripeGateway {
  private stripe: Stripe | null = null;
  private webhookSecret: string = '';
  private readonly logger = new Logger(StripeGateway.name);

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService.get('STRIPE_SECRET_KEY');
    this.webhookSecret = this.configService.get('STRIPE_WEBHOOK_SECRET') || '';

    if (secretKey) {
      this.stripe = new Stripe(secretKey, { apiVersion: '2024-06-20' as any });
    } else {
      this.logger.warn('Stripe keys not configured - payment gateway disabled');
    }
  }

  async createPaymentIntent(amount: number, currency: string = 'USD'): Promise<PaymentIntentResult> {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    const intent = await this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe uses cents
      currency: currency.toLowerCase(),
    });

    if (!intent.client_secret) {
      throw new Error('Failed to create Stripe Payment Intent');
    }

    return {
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
    };
  }

  async constructWebhookEvent(payload: Buffer, signature: string): Promise<any> {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      this.webhookSecret,
    );
  }

  async refund(paymentIntentId: string, amount?: number): Promise<string> {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    const refund = await this.stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined,
    });

    return refund.id;
  }
}