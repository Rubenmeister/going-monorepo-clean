/**
 * Mobile Wallet Service
 * Stripe integration, payment processing, wallet management
 */

import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';

export interface Wallet {
  id?: string;
  userId: string;
  balance: number;
  currency: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'CLOSED';
  createdAt: Date;
  updatedAt: Date;
}

export interface WalletTransaction {
  id?: string;
  walletId: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  description: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  paymentMethod: 'STRIPE' | 'GOOGLE_PAY' | 'APPLE_PAY' | 'BANK_TRANSFER';
  stripePaymentIntentId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  completedAt?: Date;
}

export interface PaymentIntent {
  id?: string;
  stripeIntentId: string;
  walletId: string;
  amount: number;
  currency: string;
  status:
    | 'REQUIRES_PAYMENT_METHOD'
    | 'REQUIRES_CONFIRMATION'
    | 'REQUIRES_ACTION'
    | 'PROCESSING'
    | 'REQUIRES_CAPTURE'
    | 'CANCELED'
    | 'SUCCEEDED';
  paymentMethod?: string;
  clientSecret?: string;
  createdAt: Date;
}

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);
  private readonly stripe: Stripe;

  // In-memory storage for demo (use MongoDB in production)
  private wallets: Map<string, Wallet> = new Map();
  private transactions: Map<string, WalletTransaction> = new Map();
  private paymentIntents: Map<string, PaymentIntent> = new Map();

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_demo', {
      apiVersion: '2023-10-16',
    });
  }

  /**
   * Create wallet for user
   */
  async createWallet(userId: string, currency = 'USD'): Promise<Wallet> {
    try {
      const walletId = `wallet-${userId}-${Date.now()}`;
      const wallet: Wallet = {
        id: walletId,
        userId,
        balance: 0,
        currency,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.wallets.set(walletId, wallet);
      this.logger.log(`💳 Wallet created for user ${userId}: ${walletId}`);
      return wallet;
    } catch (error) {
      this.logger.error(`Failed to create wallet: ${error}`);
      throw error;
    }
  }

  /**
   * Get wallet by user ID
   */
  async getWallet(userId: string): Promise<Wallet | null> {
    try {
      const wallets = Array.from(this.wallets.values()).filter(
        (w) => w.userId === userId
      );
      return wallets.length > 0 ? wallets[0] : null;
    } catch (error) {
      this.logger.error(`Failed to get wallet: ${error}`);
      throw error;
    }
  }

  /**
   * Initiate payment with Stripe
   * Supports Stripe, Google Pay, and Apple Pay
   */
  async initiatePayment(
    walletId: string,
    amount: number,
    paymentMethod: 'STRIPE' | 'GOOGLE_PAY' | 'APPLE_PAY',
    returnUrl?: string
  ): Promise<PaymentIntent> {
    try {
      // Create Stripe PaymentIntent
      const stripeIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        payment_method_types: this.getPaymentMethodTypes(paymentMethod),
        metadata: {
          walletId,
          paymentMethod,
        },
      });

      const paymentIntent: PaymentIntent = {
        id: `pi-${Date.now()}`,
        stripeIntentId: stripeIntent.id,
        walletId,
        amount,
        currency: 'USD',
        status: stripeIntent.status as any,
        clientSecret: stripeIntent.client_secret || undefined,
        createdAt: new Date(),
      };

      this.paymentIntents.set(paymentIntent.id!, paymentIntent);
      this.logger.log(
        `💰 Payment intent created: ${stripeIntent.id} for wallet ${walletId}`
      );

      return paymentIntent;
    } catch (error) {
      this.logger.error(`Failed to initiate payment: ${error}`);
      throw error;
    }
  }

  /**
   * Confirm payment and credit wallet
   */
  async confirmPayment(paymentIntentId: string): Promise<WalletTransaction> {
    try {
      const paymentIntent = this.paymentIntents.get(paymentIntentId);
      if (!paymentIntent) {
        throw new Error('Payment intent not found');
      }

      // Verify payment with Stripe
      const stripeIntent = await this.stripe.paymentIntents.retrieve(
        paymentIntent.stripeIntentId
      );

      if (stripeIntent.status !== 'succeeded') {
        throw new Error(`Payment failed: ${stripeIntent.status}`);
      }

      // Update wallet balance
      const wallet = this.wallets.get(paymentIntent.walletId);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      wallet.balance += paymentIntent.amount;
      wallet.updatedAt = new Date();

      // Record transaction
      const transaction: WalletTransaction = {
        id: `txn-${Date.now()}`,
        walletId: paymentIntent.walletId,
        type: 'CREDIT',
        amount: paymentIntent.amount,
        description: `Top-up via Stripe`,
        status: 'COMPLETED',
        paymentMethod: stripeIntent.payment_method_types[0] as any,
        stripePaymentIntentId: stripeIntent.id,
        createdAt: new Date(),
        completedAt: new Date(),
      };

      this.transactions.set(transaction.id!, transaction);
      this.logger.log(`✅ Payment confirmed and wallet credited: ${wallet.id}`);

      return transaction;
    } catch (error) {
      this.logger.error(`Failed to confirm payment: ${error}`);
      throw error;
    }
  }

  /**
   * Create payment token for Apple Pay / Google Pay
   */
  async createPaymentToken(
    walletId: string,
    amount: number,
    paymentMethod: 'APPLE_PAY' | 'GOOGLE_PAY'
  ): Promise<{ token: string; secret: string }> {
    try {
      const payment = await this.initiatePayment(
        walletId,
        amount,
        paymentMethod
      );

      return {
        token: payment.stripeIntentId,
        secret: payment.clientSecret || '',
      };
    } catch (error) {
      this.logger.error(`Failed to create payment token: ${error}`);
      throw error;
    }
  }

  /**
   * Debit wallet for service usage
   */
  async debitWallet(
    walletId: string,
    amount: number,
    description: string
  ): Promise<WalletTransaction> {
    try {
      const wallet = this.wallets.get(walletId);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      if (wallet.balance < amount) {
        throw new Error('Insufficient balance');
      }

      wallet.balance -= amount;
      wallet.updatedAt = new Date();

      const transaction: WalletTransaction = {
        id: `txn-${Date.now()}`,
        walletId,
        type: 'DEBIT',
        amount,
        description,
        status: 'COMPLETED',
        paymentMethod: 'STRIPE',
        createdAt: new Date(),
        completedAt: new Date(),
      };

      this.transactions.set(transaction.id!, transaction);
      this.logger.log(
        `💸 Wallet debited: ${walletId} - $${amount} (${description})`
      );

      return transaction;
    } catch (error) {
      this.logger.error(`Failed to debit wallet: ${error}`);
      throw error;
    }
  }

  /**
   * Get wallet transaction history
   */
  async getTransactionHistory(
    walletId: string,
    limit = 50,
    offset = 0
  ): Promise<WalletTransaction[]> {
    try {
      const txns = Array.from(this.transactions.values())
        .filter((t) => t.walletId === walletId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(offset, offset + limit);

      return txns;
    } catch (error) {
      this.logger.error(`Failed to get transaction history: ${error}`);
      throw error;
    }
  }

  /**
   * Process refund
   */
  async processRefund(
    transactionId: string,
    reason?: string
  ): Promise<WalletTransaction> {
    try {
      const originalTxn = this.transactions.get(transactionId);
      if (!originalTxn) {
        throw new Error('Transaction not found');
      }

      if (originalTxn.stripePaymentIntentId) {
        // Refund with Stripe
        await this.stripe.refunds.create({
          payment_intent: originalTxn.stripePaymentIntentId,
          reason: reason as Stripe.RefundCreateParams.Reason | undefined,
        });
      }

      // Credit wallet back
      const wallet = this.wallets.get(originalTxn.walletId);
      if (wallet) {
        wallet.balance += originalTxn.amount;
        wallet.updatedAt = new Date();
      }

      // Record refund transaction
      const refundTxn: WalletTransaction = {
        id: `txn-${Date.now()}`,
        walletId: originalTxn.walletId,
        type: 'CREDIT',
        amount: originalTxn.amount,
        description: `Refund for transaction ${transactionId}`,
        status: 'COMPLETED',
        paymentMethod: originalTxn.paymentMethod,
        createdAt: new Date(),
        completedAt: new Date(),
      };

      this.transactions.set(refundTxn.id!, refundTxn);
      originalTxn.status = 'REFUNDED';

      this.logger.log(
        `💰 Refund processed: ${refundTxn.id} for ${originalTxn.walletId}`
      );
      return refundTxn;
    } catch (error) {
      this.logger.error(`Failed to process refund: ${error}`);
      throw error;
    }
  }

  /**
   * Set up recurring payment subscription
   */
  async createRecurringPayment(
    walletId: string,
    amount: number,
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY'
  ): Promise<any> {
    try {
      const wallet = this.wallets.get(walletId);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      // Create Stripe subscription
      const stripeSubscription = await this.stripe.subscriptions.create({
        customer: await this.getOrCreateStripeCustomer(walletId),
        items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Wallet Top-up - ${frequency}`,
              },
              recurring: {
                interval: this.mapFrequencyToInterval(frequency),
                interval_count: 1,
              },
              unit_amount: Math.round(amount * 100),
            },
          },
        ],
        metadata: {
          walletId,
          frequency,
        },
      });

      this.logger.log(
        `📅 Recurring payment created: ${stripeSubscription.id} for wallet ${walletId}`
      );

      return {
        subscriptionId: stripeSubscription.id,
        status: stripeSubscription.status,
        nextBillingDate: new Date(stripeSubscription.current_period_end * 1000),
      };
    } catch (error) {
      this.logger.error(`Failed to create recurring payment: ${error}`);
      throw error;
    }
  }

  // Helper methods
  private getPaymentMethodTypes(paymentMethod: string): string[] {
    switch (paymentMethod) {
      case 'GOOGLE_PAY':
        return ['google_pay'];
      case 'APPLE_PAY':
        return ['apple_pay'];
      default:
        return ['card'];
    }
  }

  private mapFrequencyToInterval(
    frequency: string
  ): 'day' | 'week' | 'month' | 'year' {
    const map: Record<string, 'day' | 'week' | 'month' | 'year'> = {
      DAILY: 'day',
      WEEKLY: 'week',
      MONTHLY: 'month',
      QUARTERLY: 'month',
      YEARLY: 'year',
    };
    return map[frequency] || 'month';
  }

  private async getOrCreateStripeCustomer(walletId: string): Promise<string> {
    // In production, store Stripe customer ID
    const customer = await this.stripe.customers.create({
      metadata: { walletId },
    });
    return customer.id;
  }
}
