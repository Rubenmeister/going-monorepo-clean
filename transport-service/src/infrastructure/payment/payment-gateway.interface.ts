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
 *
 * Flujo de pago en viajes:
 *  Al iniciar el viaje → authorize(estimatedAmount)  — bloqueo en tarjeta
 *  Al terminar el viaje → capture(gatewayRef, realAmount) — cobro real
 *  Si el monto real > estimado → se hace un capture por el exceso
 */

export type PaymentMode   = 'redirect' | 'lightbox' | 'direct_api' | 'qr';
export type PaymentStatus = 'pending' | 'processing' | 'approved' | 'rejected' | 'error';

// ─── Initiate (checkout flow) ──────────────────────────────────────────────────

export interface InitiatePaymentInput {
  transactionId: string;   // UUID generado por Going
  rideId:        string;
  userId:        string;
  amountUsd:     number;   // En dólares con 2 decimales (Ecuador usa USD)
  description:   string;
  returnUrl:     string;   // URL a la que el gateway redirige tras el pago
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
  // Redirect / Lightbox
  redirectUrl?:   string;
  token?:         string;
  checkoutJsUrl?: string;
  // QR (DeUna)
  qrCodeUrl?:     string;   // URL de la imagen QR
  qrPaymentLink?: string;   // Link de pago para app móvil
  // Direct API
  status?:        PaymentStatus;
  gatewayRef?:    string;   // Referencia del proveedor (necesaria para capture)
}

// ─── Authorize + Capture (pre-auth flow) ─────────────────────────────────────

export interface AuthorizeInput {
  transactionId: string;   // UUID Going
  rideId:        string;
  userId:        string;
  amountUsd:     number;   // Monto estimado del viaje
  description:   string;
  cardToken?:    string;   // Token de tarjeta ya registrada (para Datafast)
  cardDetails?:  InitiatePaymentInput['cardDetails'];
}

export interface AuthorizeResult {
  transactionId: string;
  gatewayRef:    string;   // ID de la pre-auth en el gateway — guardar para capture
  status:        'authorized' | 'rejected' | 'pending_qr';
  /** Para DeUna: link/QR que el pasajero debe confirmar antes de iniciar el viaje */
  qrCodeUrl?:    string;
  qrPaymentLink?: string;
  error?:        string;
}

export interface CaptureInput {
  gatewayRef:    string;   // De AuthorizeResult.gatewayRef
  transactionId: string;
  amountUsd:     number;   // Monto real (puede diferir del autorizado)
}

export interface CaptureResult {
  transactionId: string;
  gatewayRef:    string;
  status:        PaymentStatus;
  chargedAmount: number;
  error?:        string;
}

// ─── Status ───────────────────────────────────────────────────────────────────

export interface PaymentStatusResult {
  transactionId: string;
  status:        PaymentStatus;
  gatewayRef?:   string;
  paidAt?:       Date;
  amount?:       number;
  error?:        string;
}

// ─── Webhook ──────────────────────────────────────────────────────────────────

export interface WebhookResult {
  transactionId: string;
  status:        PaymentStatus;
  gatewayRef:    string;
  raw:           Record<string, unknown>;
}

// ─── Interface ────────────────────────────────────────────────────────────────

export interface IPaymentGateway {
  /** Nombre del proveedor (para logs y diagnóstico) */
  readonly name: string;

  /** Modo que usa este proveedor por defecto */
  readonly defaultMode: PaymentMode;

  /** Inicia una transacción de checkout (one-shot) */
  initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentResult>;

  /**
   * Pre-autoriza un monto (bloqueo en tarjeta).
   * Datafast: tipo PA (Pre-Authorization).
   * DeUna: genera QR/link — el pasajero confirma pago antes de iniciar el viaje.
   */
  authorize(input: AuthorizeInput): Promise<AuthorizeResult>;

  /**
   * Captura el cobro real tras completar el viaje.
   * Datafast: tipo CP (Capture).
   * DeUna: no aplica — el pago ya fue capturado al confirmar el QR.
   */
  capture(input: CaptureInput): Promise<CaptureResult>;

  /** Consulta el estado de una transacción por referencia interna */
  getStatus(transactionId: string): Promise<PaymentStatusResult>;

  /** Procesa el webhook/callback que envía el proveedor a nuestro backend */
  handleWebhook(
    headers: Record<string, string>,
    body: Record<string, unknown>,
  ): Promise<WebhookResult>;
}
