/**
 * Payment types and interfaces
 */

export type PaymentMethod = 'card' | 'wallet' | 'cash';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface PaymentMethodConfig {
  label: string;
  emoji: string;
  requiresDetails: boolean;
}

export const PAYMENT_METHODS: Record<PaymentMethod, PaymentMethodConfig> = {
  card: { label: 'Card', emoji: '💳', requiresDetails: true },
  wallet: { label: 'Wallet', emoji: '👛', requiresDetails: false },
  cash: { label: 'Cash', emoji: '💵', requiresDetails: false },
};

export interface PaymentSummary {
  baseFare: number;
  platformFeePercentage: number;
  platformFee: number;
  total: number;
}

export interface CardDetails {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
}

export interface PaymentRequest {
  rideId: string;
  amount: number;
  method: PaymentMethod;
  cardDetails?: CardDetails;
}

export interface PaymentResponse {
  transactionId: string;
  status: PaymentStatus;
  amount: number;
  timestamp: Date;
}

export const PLATFORM_FEE_PERCENTAGE = 20; // 20% fee
