import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { Result, ok, err } from 'neverthrow';
import { IPaymentGateway, PaymentIntentResult } from '@going-monorepo-clean/domains-payment-core';
import { Money } from '@going-monorepo-clean/shared-domain';

@Injectable()
export class StripeGateway implements IPaymentGateway {
  private readonly stripe: Stripe;
  private readonly webhookSecret: string;
  private readonly logger = new Logger(StripeGateway.name);

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService.get('STRIPE_SECRET_KEY');
    this.webhookSecret = this.configService.get('STRIPE_WEBHOOK_SECRET');

    if (!secretKey || !this.webhookSecret) {
      this.logger.error('Stripe keys not configured');
      throw new Error('Stripe keys not configured');
    }

    this.stripe = new Stripe(secretKey, { apiVersion: '2024-06-20' as any });
  }

  async createPaymentIntent(amount: Money): Promise<Result<PaymentIntentResult, Error>> {
    try {
      const intent = await this.stripe.paymentIntents.create({
        amount: amount.amount,
        currency: amount.currency,
      });

      if (!intent.client_secret) {
        return err(new Error('Failed to create Stripe Payment Intent'));
      }

      return ok({
        clientSecret: intent.client_secret,
        paymentIntentId: intent.id,
      });
    } catch (error) {
      return err(new Error(error.message));
    }
  }

  async constructWebhookEvent(payload: Buffer, signature: string): Promise<Result<any, Error>> {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.webhookSecret,
      );
      return ok(event);
    } catch (err: any) {
      this.logger.error(`Stripe signature verification failed: ${err.message}`);
      return err(new Error(`Webhook Error: ${err.message}`));
    }
  }
}