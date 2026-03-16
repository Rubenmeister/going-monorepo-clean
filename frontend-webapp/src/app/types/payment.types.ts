/**
 * Tipos de pago Going — compatibles con la arquitectura DATAFAST
 */

export type PaymentMethod = 'datafast' | 'cash';
export type PaymentStatus = 'pending' | 'processing' | 'approved' | 'rejected' | 'error';
export type PaymentMode   = 'redirect' | 'lightbox' | 'direct_api';

export interface PaymentMethodConfig {
  label:           string;
  emoji:           string;
  requiresDetails: boolean;
  description:     string;
}

export const PAYMENT_METHODS: Record<PaymentMethod, PaymentMethodConfig> = {
  datafast: {
    label:           'Tarjeta (DATAFAST)',
    emoji:           '💳',
    requiresDetails: false,  // Los datos se ingresan en DATAFAST, no aquí
    description:     'Visa, Mastercard, Amex — procesado por DATAFAST Ecuador',
  },
  cash: {
    label:           'Efectivo',
    emoji:           '💵',
    requiresDetails: false,
    description:     'Paga en efectivo al conductor al finalizar el viaje',
  },
};

export interface PaymentSummary {
  baseFare:              number;
  platformFeePercentage: number;
  platformFee:           number;
  total:                 number;
}

/** Respuesta del backend al iniciar un pago */
export interface InitiatePaymentResult {
  mode:           PaymentMode;
  transactionId:  string;
  redirectUrl?:   string;    // Para modo redirect
  token?:         string;    // Para modo lightbox
  checkoutJsUrl?: string;    // Para modo lightbox
  status?:        PaymentStatus; // Para modo direct_api
  gatewayRef?:    string;
}

/** Respuesta al consultar estado de un pago */
export interface PaymentStatusResult {
  transactionId: string;
  status:        PaymentStatus;
  gatewayRef?:   string;
  paidAt?:       string;
  amount?:       number;
  error?:        string;
}

export const PLATFORM_FEE_PERCENTAGE = 20;
