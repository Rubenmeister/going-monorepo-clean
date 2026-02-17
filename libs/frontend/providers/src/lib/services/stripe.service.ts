import axios from 'axios';

const STRIPE_PUBLIC_KEY = process.env.REACT_APP_STRIPE_PUBLIC_KEY;

if (!STRIPE_PUBLIC_KEY) {
  console.warn('Stripe public key not configured');
}

export interface PaymentIntentResponse {
  clientSecret: string;
  amount: number;
  currency: string;
  status: string;
}

export interface PaymentMethodData {
  type: 'card';
  card: {
    number: string;
    exp_month: number;
    exp_year: number;
    cvc: string;
  };
  billing_details?: {
    name?: string;
    email?: string;
    address?: {
      city?: string;
      country?: string;
      line1?: string;
      postal_code?: string;
      state?: string;
    };
  };
}

class StripePaymentService {
  private stripePromise: Promise<any> | null = null;

  async getStripe() {
    if (!this.stripePromise && typeof window !== 'undefined') {
      // @ts-ignore
      this.stripePromise = window.Stripe?.(STRIPE_PUBLIC_KEY);
    }
    return this.stripePromise;
  }

  async createPaymentIntent(
    bookingId: string,
    amount: number,
    currency: string = 'USD'
  ): Promise<PaymentIntentResponse> {
    const response = await axios.post('/api/payments/intent', {
      bookingId,
      amount,
      currency,
    });
    return response.data;
  }

  async confirmPayment(clientSecret: string, paymentMethodId: string) {
    const stripe = await this.getStripe();
    if (!stripe) throw new Error('Stripe not loaded');

    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: paymentMethodId,
    });

    return result;
  }

  async handlePaymentError(error: any) {
    console.error('[Stripe] Payment error:', error);
    throw new Error(error.message || 'Payment failed');
  }
}

export const stripePaymentService = new StripePaymentService();
