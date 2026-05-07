import { v4 as uuidv4 } from 'uuid';
import { Result, ok, err } from 'neverthrow';
import { Money, UUID, Location } from '@going-monorepo-clean/shared-domain'; // Reemplaza con tu scope

export type ParcelStatus =
  | 'pending'
  | 'pending_payment'           // A: esperando que el sender pague con tarjeta
  | 'pending_recipient_payment' // C: el conductor matcheado espera el pago del receptor
  | 'pickup_assigned'
  | 'in_transit'
  | 'delivered'
  | 'cancelled';

/**
 * Cuatro escenarios de pago:
 *   A) sender + card  → pre-pay con Datafast/DeUna antes de matchear driver
 *   B) sender + cash  → driver cobra al sender al recoger
 *   C) recipient + card → driver matchea, link enviado al receptor por SMS
 *   D) recipient + cash → "contra entrega": driver cobra al receptor al entregar
 */
export type ParcelPaymentMethod = 'card' | 'cash';
export type ParcelPayerRole = 'sender' | 'recipient';
export type ParcelPaymentStatus =
  | 'pending'           // B: aún sin cobrar (esperando pickup)
  | 'pending_payment'   // A o C: payment intent creado, esperando confirmación
  | 'paid'              // A o C: webhook confirmó card
  | 'paid_at_pickup'    // B: driver confirmó cash del sender
  | 'paid_at_delivery'  // D: driver confirmó cash del receptor
  | 'failed';           // A o C: rechazo Datafast / OBS provider

export interface ParcelProps {
  id: UUID;
  userId: UUID;
  driverId?: UUID;
  origin: Location;
  destination: Location;
  description: string;
  price: Money;
  status: ParcelStatus;
  trackingCode: string;
  otpPin: string;
  createdAt: Date;
  // Payment tracking — opcional para retrocompat con parcels viejos sin estos
  // campos. Por defecto, parcels legacy se asumen sender+cash (B).
  paymentMethod?: ParcelPaymentMethod;
  payerRole?: ParcelPayerRole;
  paymentStatus?: ParcelPaymentStatus;
  paymentIntentId?: string;
  paymentLinkUrl?: string;
  recipientPhone?: string;     // requerido para C (link SMS) y D (contacto)
  recipientName?: string;
  cashConfirmedAt?: Date;
  cashConfirmedBy?: UUID;      // driverId que cobró el efectivo
  // OTP rate-limiting (anti brute-force, OTP es 4 dígitos = 10K combos)
  otpAttempts?: number;
  otpLockedUntil?: Date;
}

export class Parcel {
  readonly id: UUID;
  readonly userId: UUID;
  readonly driverId?: UUID;
  readonly origin: Location;
  readonly destination: Location;
  readonly description: string;
  readonly price: Money;
  readonly status: ParcelStatus;
  readonly trackingCode: string;
  readonly otpPin: string;
  readonly createdAt: Date;
  readonly paymentMethod?: ParcelPaymentMethod;
  readonly payerRole?: ParcelPayerRole;
  readonly paymentStatus?: ParcelPaymentStatus;
  readonly paymentIntentId?: string;
  readonly paymentLinkUrl?: string;
  readonly recipientPhone?: string;
  readonly recipientName?: string;
  readonly cashConfirmedAt?: Date;
  readonly cashConfirmedBy?: UUID;
  readonly otpAttempts?: number;
  readonly otpLockedUntil?: Date;

  private constructor(props: ParcelProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.driverId = props.driverId;
    this.origin = props.origin;
    this.destination = props.destination;
    this.description = props.description;
    this.price = props.price;
    this.status = props.status;
    this.trackingCode = props.trackingCode;
    this.otpPin = props.otpPin;
    this.createdAt = props.createdAt;
    this.paymentMethod = props.paymentMethod;
    this.payerRole = props.payerRole;
    this.paymentStatus = props.paymentStatus;
    this.paymentIntentId = props.paymentIntentId;
    this.paymentLinkUrl = props.paymentLinkUrl;
    this.recipientPhone = props.recipientPhone;
    this.recipientName = props.recipientName;
    this.cashConfirmedAt = props.cashConfirmedAt;
    this.cashConfirmedBy = props.cashConfirmedBy;
    this.otpAttempts = props.otpAttempts;
    this.otpLockedUntil = props.otpLockedUntil;
  }

  /**
   * Factory para crear un nuevo envío.
   *
   * El estado inicial depende del esquema de pago:
   *  - sender+card (A) → 'pending_payment' (orchestrator espera webhook)
   *  - sender+cash (B) → 'pending' (orchestrator matchea inmediato, cobro al pickup)
   *  - recipient+card (C) → 'pending' inicialmente; cuando driver acepta, controller
   *      crea payment intent y transiciona a 'pending_recipient_payment'
   *  - recipient+cash (D) → 'pending' (cobro al delivery)
   *
   * paymentMethod + payerRole son opcionales; sin ellos se asume cash+sender (B legacy).
   */
  public static create(props: {
    userId: UUID;
    origin: Location;
    destination: Location;
    description: string;
    price: Money;
    paymentMethod?: ParcelPaymentMethod;
    payerRole?: ParcelPayerRole;
    recipientPhone?: string;
    recipientName?: string;
  }): Result<Parcel, Error> {

    if (props.description.length < 3) {
      return err(new Error('Description must be at least 3 characters'));
    }
    if (!props.price.isPositive()) {
      return err(new Error('Price must be positive'));
    }

    const paymentMethod = props.paymentMethod ?? 'cash';
    const payerRole = props.payerRole ?? 'sender';

    // Validación: si el receptor paga (cualquier método), recipientPhone es obligatorio
    if (payerRole === 'recipient' && !props.recipientPhone) {
      return err(new Error('recipientPhone is required when payerRole=recipient'));
    }
    // Si recipient+card (C), también necesitamos al menos un nombre legible
    if (payerRole === 'recipient' && paymentMethod === 'card' && !props.recipientName) {
      return err(new Error('recipientName is required for recipient card payments'));
    }

    // Estado inicial según escenario
    let status: ParcelStatus = 'pending';
    let paymentStatus: ParcelPaymentStatus = 'pending';
    if (payerRole === 'sender' && paymentMethod === 'card') {
      // A: bloquear matching hasta confirmación de pago
      status = 'pending_payment';
      paymentStatus = 'pending_payment';
    }

    const trackingCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const otpPin = String(Math.floor(1000 + Math.random() * 9000));

    const parcel = new Parcel({
      id: uuidv4(),
      ...props,
      paymentMethod,
      payerRole,
      paymentStatus,
      status,
      trackingCode,
      otpPin,
      createdAt: new Date(),
    });

    return ok(parcel);
  }

  // --- Métodos de Persistencia ---
  
  public toPrimitives(): any {
    return {
      id: this.id,
      userId: this.userId,
      driverId: this.driverId,
      origin: this.origin.toPrimitives(),
      destination: this.destination.toPrimitives(),
      description: this.description,
      price: this.price.toPrimitives(),
      status: this.status,
      trackingCode: this.trackingCode,
      otpPin: this.otpPin,
      createdAt: this.createdAt,
      paymentMethod: this.paymentMethod,
      payerRole: this.payerRole,
      paymentStatus: this.paymentStatus,
      paymentIntentId: this.paymentIntentId,
      paymentLinkUrl: this.paymentLinkUrl,
      recipientPhone: this.recipientPhone,
      recipientName: this.recipientName,
      cashConfirmedAt: this.cashConfirmedAt,
      cashConfirmedBy: this.cashConfirmedBy,
      otpAttempts: this.otpAttempts,
      otpLockedUntil: this.otpLockedUntil,
    };
  }

  public static fromPrimitives(props: any): Parcel {
    return new Parcel({
      ...props,
      origin: Location.fromPrimitives(props.origin),
      destination: Location.fromPrimitives(props.destination),
      price: Money.fromPrimitives(props.price),
    });
  }

  // --- Lógica de Negocio ---
  
  public assignDriver(driverId: UUID): Result<void, Error> {
    // Permitir asignación desde 'pending' (B/D normal) o 'pending_recipient_payment'
    // (C donde el driver acepta antes de que receptor pague — hay que pagar antes
    // de soltar el paquete pero el match ya ocurrió).
    if (this.status !== 'pending') {
      return err(new Error(`Parcel cannot be assigned from status ${this.status}`));
    }
    (this as any).driverId = driverId;
    (this as any).status = 'pickup_assigned';
    return ok(undefined);
  }

  public markAsInTransit(): Result<void, Error> {
    if (this.status !== 'pickup_assigned') {
      return err(new Error('Parcel must be assigned to a driver first'));
    }
    // Si es escenario B (sender+cash), el cobro debe haberse confirmado antes
    // de marcar in_transit — el driver no puede llevarse el paquete sin cobrar.
    if (
      this.paymentMethod === 'cash' &&
      this.payerRole === 'sender' &&
      this.paymentStatus !== 'paid_at_pickup'
    ) {
      return err(new Error('Cash from sender must be confirmed before pickup (use confirm-cash-pickup endpoint)'));
    }
    (this as any).status = 'in_transit';
    return ok(undefined);
  }

  public deliver(): Result<void, Error> {
    if (this.status !== 'in_transit') {
      return err(new Error('Parcel is not in transit'));
    }
    // Para escenarios donde el receptor paga, NO se entrega hasta confirmar pago.
    // C: paymentStatus debe ser 'paid' (webhook ya confirmó card del receptor)
    // D: paymentStatus debe ser 'paid_at_delivery' (driver confirmó cash del receptor)
    if (this.payerRole === 'recipient') {
      const ok =
        this.paymentMethod === 'card'
          ? this.paymentStatus === 'paid'
          : this.paymentStatus === 'paid_at_delivery';
      if (!ok) {
        return err(new Error('Recipient payment must be confirmed before delivery'));
      }
    }
    (this as any).status = 'delivered';
    return ok(undefined);
  }

  /** Driver confirma efectivo cobrado al sender (B) o al receptor (D). */
  public confirmCash(driverId: UUID, when: 'pickup' | 'delivery'): Result<void, Error> {
    if (this.paymentMethod !== 'cash') {
      return err(new Error('confirmCash only valid for cash parcels'));
    }
    if (when === 'pickup' && this.payerRole !== 'sender') {
      return err(new Error('Cash at pickup is only valid for sender-paid parcels'));
    }
    if (when === 'delivery' && this.payerRole !== 'recipient') {
      return err(new Error('Cash at delivery is only valid for recipient-paid parcels'));
    }
    if (this.driverId !== driverId) {
      return err(new Error('Only the assigned driver can confirm cash collection'));
    }
    (this as any).paymentStatus = when === 'pickup' ? 'paid_at_pickup' : 'paid_at_delivery';
    (this as any).cashConfirmedAt = new Date();
    (this as any).cashConfirmedBy = driverId;
    return ok(undefined);
  }

  /**
   * Verifica el OTP entregado por el receptor con rate-limit anti brute-force.
   *
   * Política:
   *  - 5 intentos fallidos consecutivos → lockout 1 hora
   *  - OTP correcto resetea el contador
   *  - Durante lockout, cualquier intento falla con `locked` flag
   *
   * El driver app puede mostrar tiempo restante en lockout para UX clara.
   * 4 dígitos = 10K combos; sin rate-limit, brute force toma <1 min via API.
   */
  public verifyOtp(provided: string): Result<{ ok: boolean; lockedUntil?: Date; attemptsLeft?: number }, Error> {
    const now = new Date();
    if (this.otpLockedUntil && this.otpLockedUntil > now) {
      return ok({ ok: false, lockedUntil: this.otpLockedUntil });
    }
    if (this.otpPin === provided) {
      // Reset contador en éxito
      (this as any).otpAttempts = 0;
      (this as any).otpLockedUntil = undefined;
      return ok({ ok: true });
    }
    // Falló — incrementar
    const attempts = (this.otpAttempts ?? 0) + 1;
    (this as any).otpAttempts = attempts;
    if (attempts >= 5) {
      // Lockout 1 hora
      const lockedUntil = new Date(now.getTime() + 60 * 60 * 1000);
      (this as any).otpLockedUntil = lockedUntil;
      return ok({ ok: false, lockedUntil, attemptsLeft: 0 });
    }
    return ok({ ok: false, attemptsLeft: 5 - attempts });
  }

  /** Webhook desde payment-service: card pagada (escenarios A o C). */
  public markPaymentConfirmed(): Result<void, Error> {
    if (this.paymentMethod !== 'card') {
      return err(new Error('markPaymentConfirmed only valid for card parcels'));
    }
    if (this.paymentStatus === 'paid') return ok(undefined); // idempotente
    (this as any).paymentStatus = 'paid';
    // Para escenario A: una vez pagado el sender, parcel queda 'pending' para
    // que el orchestrator lo matchee. Para C: el driver ya está asignado, no
    // cambiamos status — solo paymentStatus.
    if (this.payerRole === 'sender' && this.status === 'pending_payment') {
      (this as any).status = 'pending';
    }
    return ok(undefined);
  }

  /** Webhook desde payment-service: card rechazada / failed. */
  public markPaymentFailed(): Result<void, Error> {
    if (this.paymentMethod !== 'card') {
      return err(new Error('markPaymentFailed only valid for card parcels'));
    }
    (this as any).paymentStatus = 'failed';
    return ok(undefined);
  }

  /**
   * Set payment intent details after creating it via payment-service.
   * Para A: llamado en POST /parcels create.
   * Para C: llamado en PATCH /parcels/:id/accept después que driver aceptó.
   */
  public setPaymentIntent(intentId: string, linkUrl?: string): void {
    (this as any).paymentIntentId = intentId;
    if (linkUrl) (this as any).paymentLinkUrl = linkUrl;
    // Para C: ahora estamos esperando que el receptor pague
    if (this.payerRole === 'recipient' && this.paymentMethod === 'card') {
      (this as any).status = 'pending_recipient_payment';
      (this as any).paymentStatus = 'pending_payment';
    }
  }

  /**
   * Cancelar el envío cuando aún no hay conductor asignado o justo antes
   * del pickup. Prohibido una vez en tránsito o entregado.
   *
   * El `reason` opcional se anexa al description para dejar traza
   * (no requiere cambio de schema). Patrón: "[CANCEL:<reason>] <desc>".
   */
  public cancel(reason?: string): Result<void, Error> {
    if (this.status === 'in_transit' || this.status === 'delivered') {
      return err(
        new Error('Parcel cannot be cancelled after pickup or delivery'),
      );
    }
    if (this.status === 'cancelled') return ok(undefined); // idempotente
    (this as any).status = 'cancelled';
    if (reason && !this.description.startsWith('[CANCEL:')) {
      (this as any).description = `[CANCEL:${reason}] ${this.description}`;
    }
    return ok(undefined);
  }
}