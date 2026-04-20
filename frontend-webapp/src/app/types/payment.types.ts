/**
 * Tipos de pago Going -- compatibles con la arquitectura DATAFAST
 */

export type PaymentMethod = 'datafast' | 'deuna' | 'cash';
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
    requiresDetails: false,
    description:     'Visa, Mastercard, Amex -- procesado por DATAFAST Ecuador',
  },
  deuna: {
    label:           'DeUna (Banco Pichincha)',
    emoji:           '🏦',
    requiresDetails: false,
    description:     'Pago digital con tu cuenta Banco Pichincha',
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
  redirectUrl?:   string;
  token?:         string;
  checkoutJsUrl?: string;
  status?:        PaymentStatus;
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
