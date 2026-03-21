import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { Result, ok, err } from 'neverthrow';
import {
  IPaymentGateway,
  PaymentIntentResult,
} from '@going-monorepo-clean/domains-payment-core';
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
      this.logger.warn(
        'Stripe keys not configured - payment operations will fail until keys are set'
      );
      return;
    }

    this.stripe = new Stripe(secretKey, { apiVersion: '2024-06-20' as any });
  }

  async createPaymentIntent(
    amount: Money
  ): Promise<Result<PaymentIntentResult, Error>> {
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

  /**
   * Charge a saved payment method (card) immediately.
   * Used by ProcessPaymentUseCase for card payments.
   */
  async processPayment(input: {
    amount: number; // in cents
    currency: string;
    customerId: string;
    paymentMethodId: string;
    description?: string;
    metadata?: Record<string, string>;
  }): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    if (!this.stripe) {
      return { success: false, error: 'Stripe not configured' };
    }
    try {
      const intent = await this.stripe.paymentIntents.create({
        amount: input.amount,
        currency: input.currency.toLowerCase(),
        payment_method: input.paymentMethodId,
        confirm: true,
        description: input.description,
        metadata: input.metadata,
        automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
      });

      if (intent.status === 'succeeded') {
        return { success: true, transactionId: intent.id };
      }
      return { success: false, error: `Payment status: ${intent.status}` };
    } catch (error: any) {
      this.logger.error(`Stripe processPayment error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Transfer funds to a driver's connected Stripe account / bank.
   * Used by CreatePayoutUseCase.
   */
  async createPayout(input: {
    amount: number; // in cents
    currency: string;
    bankAccountId: string;
    description?: string;
    metadata?: Record<string, string>;
  }): Promise<{ success: boolean; payoutId?: string; error?: string }> {
    if (!this.stripe) {
      return { success: false, error: 'Stripe not configured' };
    }
    try {
      const payout = await this.stripe.payouts.create({
        amount: input.amount,
        currency: input.currency.toLowerCase(),
        description: input.description,
        metadata: input.metadata,
      });
      return { success: true, payoutId: payout.id };
    } catch (error: any) {
      this.logger.error(`Stripe createPayout error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async constructWebhookEvent(
    payload: Buffer,
    signature: string
  ): Promise<Result<any, Error>> {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.webhookSecret
      );
      return ok(event);
    } catch (err: any) {
      this.logger.error(`Stripe signature verification failed: ${err.message}`);
      return err(new Error(`Webhook Error: ${err.message}`));
    }
  }
}
