/**
 * PaymentGateway — Abstracción para procesadores de pago.
 *
 * Going soporta 3 modos según el proveedor:
 *
 *  1. REDIRECT   — El usuario es redirigido a la página de pago del proveedor.
 *                  Respuesta: { mode: 'redirect', redirectUrl }
 *                  Sin PCI compliance requerido de nuestra parte.
 *
 *  2. LIGHTBOX   — El proveedor entrega un token; el frontend carga su JS SDK
 *                  y abre un iframe/modal sobre la app.
 *                  Respuesta: { mode: 'lightbox', token, checkoutJsUrl }
 *                  Sin PCI compliance requerido de nuestra parte.
 *
 *  3. DIRECT_API — Going envía los datos de tarjeta al backend que los reenvía
 *                  al proveedor por una conexión server-to-server cifrada.
 *                  Respuesta inmediata: { mode: 'direct', status, transactionId }
 *                  Requiere PCI DSS SAQ-D o certificación equivalente.
 */

export type PaymentMode = 'redirect' | 'lightbox' | 'direct_api';
export type PaymentStatus = 'pending' | 'processing' | 'approved' | 'rejected' | 'error';

export interface InitiatePaymentInput {
  transactionId: string;   // UUID generado por Going
  rideId:        string;
  userId:        string;
  amountUsd:     number;   // En dólares con 2 decimales (Ecuador usa USD)
  description:   string;
  returnUrl:     string;   // URL a la que DATAFAST redirige tras el pago
  cancelUrl:     string;
  cardDetails?:  {         // Solo para modo DIRECT_API
    number:      string;
    expiryMonth: string;   // MM
    expiryYear:  string;   // YY
    cvv:         string;
    holderName:  string;
  };
}

export interface InitiatePaymentResult {
  mode:           PaymentMode;
  transactionId:  string;
  // Redirect
  redirectUrl?:   string;
  // Lightbox
  token?:         string;
  checkoutJsUrl?: string;
  // Direct API
  status?:        PaymentStatus;
  gatewayRef?:    string;   // Referencia del proveedor
}

export interface PaymentStatusResult {
  transactionId: string;
  status:        PaymentStatus;
  gatewayRef?:   string;
  paidAt?:       Date;
  amount?:       number;
  error?:        string;
}

export interface WebhookResult {
  transactionId: string;
  status:        PaymentStatus;
  gatewayRef:    string;
  raw:           Record<string, unknown>;
}

export interface IPaymentGateway {
  /** Nombre del proveedor (para logs y diagnóstico) */
  readonly name: string;

  /** Modo que usa este proveedor por defecto */
  readonly defaultMode: PaymentMode;

  /** Inicia una transacción y retorna instrucciones para el frontend */
  initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentResult>;

  /** Consulta el estado de una transacción por referencia interna */
  getStatus(transactionId: string): Promise<PaymentStatusResult>;

  /** Procesa el webhook/callback que envía el proveedor a nuestro backend */
  handleWebhook(
    headers: Record<string, string>,
    body: Record<string, unknown>,
  ): Promise<WebhookResult>;
}
