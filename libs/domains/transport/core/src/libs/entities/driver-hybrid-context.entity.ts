import { Result, ok, err } from 'neverthrow';
import { v4 as uuidv4 } from 'uuid';
import { UUID } from '@going-monorepo-clean/shared-domain';

/**
 * DriverHybridContext — estado del conductor durante un turno con viaje
 * interurbano (modo híbrido).
 *
 * Diferenciador del producto: el conductor que hace un interurbano
 * (ej. Quito → Santo Domingo) puede aceptar carreras cortas locales en
 * el destino mientras espera el viaje de retorno, sin riesgo de llegar
 * tarde al retorno gracias al buffer obligatorio de descanso (default
 * 45 min antes del nextLongTripStartTime).
 *
 * Esta entity es PURO state — no tiene side effects ni I/O. La state
 * machine se ejecuta acá (método `transition`). Un cron externo a este
 * core dispara las transiciones automáticas (rest window enters, return
 * starts), y un repositorio externo persiste cambios. Mantener el motor
 * sin I/O permite testearlo determinísticamente con `new Date()` mockeado.
 *
 * Estados:
 *   IDLE                  — default, no está en interurbano
 *   LONG_TRIP_OUTBOUND    — viajando OUT (ej. Quito → Santo Domingo)
 *   AVAILABLE_LOCAL       — llegó a destino, acepta carreras locales
 *   BLOCKED_REST          — dentro de los REST_BUFFER min del retorno, no más
 *                           carreras locales — descanso obligatorio
 *   LONG_TRIP_RETURN      — viajando de vuelta
 *
 * Transiciones válidas:
 *   IDLE                  --outbound_started--> LONG_TRIP_OUTBOUND
 *   LONG_TRIP_OUTBOUND    --outbound_completed--> AVAILABLE_LOCAL
 *   AVAILABLE_LOCAL       --rest_window_entered--> BLOCKED_REST
 *   AVAILABLE_LOCAL       --return_cancelled--> IDLE  (caso especial)
 *   BLOCKED_REST          --return_started--> LONG_TRIP_RETURN
 *   BLOCKED_REST          --return_cancelled--> IDLE  (caso especial)
 *   LONG_TRIP_RETURN      --return_completed--> IDLE
 *   * cualquier estado    --abort--> IDLE             (failsafe ops/admin)
 *
 * Cualquier otra transición devuelve err(InvalidTransitionError).
 */

export type DriverHybridState =
  | 'IDLE'
  | 'LONG_TRIP_OUTBOUND'
  | 'AVAILABLE_LOCAL'
  | 'BLOCKED_REST'
  | 'LONG_TRIP_RETURN';

/** Buffer obligatorio de descanso antes del retorno. */
export const DEFAULT_REST_BUFFER_MINUTES = 45;

/** Eventos que disparan transiciones. */
export type DriverHybridEvent =
  | { kind: 'outbound_started'; outboundScheduledTripId: UUID }
  | {
      kind: 'outbound_completed';
      destinationCity: string;
      returnScheduledTripId: UUID;
      nextLongTripStartTime: Date;
      /** Override opcional del buffer default (45 min). */
      restBufferMinutes?: number;
    }
  | { kind: 'rest_window_entered' }
  | { kind: 'return_started' }
  | { kind: 'return_completed' }
  | { kind: 'return_cancelled' }
  | { kind: 'abort'; reason: string };

export interface DriverHybridContextProps {
  id: UUID;
  driverId: UUID;
  state: DriverHybridState;
  /** Trip outbound que arrancó el contexto. Null cuando state==IDLE. */
  outboundScheduledTripId: UUID | null;
  /** Trip de retorno. Se setea al transition outbound_completed. */
  returnScheduledTripId: UUID | null;
  /** Ciudad/zona donde el driver opera mientras AVAILABLE_LOCAL. */
  destinationCity: string | null;
  /** Hora absoluta de inicio del viaje de retorno. */
  nextLongTripStartTime: Date | null;
  /** Hora absoluta en que entra a BLOCKED_REST = nextLongTripStartTime - buffer. */
  restWindowStartsAt: Date | null;
  /** Cuánto buffer se aplicó al calcular restWindowStartsAt (audit). */
  restBufferMinutes: number;
  /** Razón cuando la entrada IDLE viene de abort/cancel (audit). */
  lastTransitionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Error de transición inválida — la state machine no permite ese evento
 * desde el estado actual.
 */
export class InvalidHybridTransitionError extends Error {
  constructor(
    public readonly fromState: DriverHybridState,
    public readonly eventKind: DriverHybridEvent['kind'],
  ) {
    super(
      `InvalidHybridTransition: ${fromState} --${eventKind}--> ?? (no permitido)`,
    );
    this.name = 'InvalidHybridTransitionError';
  }
}

export class DriverHybridContext {
  readonly id: UUID;
  readonly driverId: UUID;
  readonly state: DriverHybridState;
  readonly outboundScheduledTripId: UUID | null;
  readonly returnScheduledTripId: UUID | null;
  readonly destinationCity: string | null;
  readonly nextLongTripStartTime: Date | null;
  readonly restWindowStartsAt: Date | null;
  readonly restBufferMinutes: number;
  readonly lastTransitionReason: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  private constructor(props: DriverHybridContextProps) {
    this.id = props.id;
    this.driverId = props.driverId;
    this.state = props.state;
    this.outboundScheduledTripId = props.outboundScheduledTripId;
    this.returnScheduledTripId = props.returnScheduledTripId;
    this.destinationCity = props.destinationCity;
    this.nextLongTripStartTime = props.nextLongTripStartTime;
    this.restWindowStartsAt = props.restWindowStartsAt;
    this.restBufferMinutes = props.restBufferMinutes;
    this.lastTransitionReason = props.lastTransitionReason;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  /**
   * Crea un contexto fresco en estado IDLE para un driver. Útil para
   * inicializar la primera vez que el driver acepta un interurbano.
   */
  static create(props: { driverId: UUID }): Result<DriverHybridContext, Error> {
    if (!props.driverId) return err(new Error('driverId is required'));
    const now = new Date();
    return ok(
      new DriverHybridContext({
        id: uuidv4() as UUID,
        driverId: props.driverId,
        state: 'IDLE',
        outboundScheduledTripId: null,
        returnScheduledTripId: null,
        destinationCity: null,
        nextLongTripStartTime: null,
        restWindowStartsAt: null,
        restBufferMinutes: DEFAULT_REST_BUFFER_MINUTES,
        lastTransitionReason: null,
        createdAt: now,
        updatedAt: now,
      }),
    );
  }

  /**
   * Aplica un evento a la state machine y devuelve un nuevo
   * DriverHybridContext con el estado siguiente, o err si la transición
   * es inválida desde el estado actual.
   *
   * Inmutable: NUNCA muta `this`. Cada transición es un objeto nuevo.
   * El caller persiste el resultado vía repositorio si ok.
   *
   * @param event       Evento a aplicar.
   * @param now         Hora actual (default new Date()). Inyectable para tests.
   */
  transition(
    event: DriverHybridEvent,
    now: Date = new Date(),
  ): Result<DriverHybridContext, Error> {
    // Failsafe: abort lleva a IDLE desde cualquier estado.
    if (event.kind === 'abort') {
      return ok(
        this.copyWith({
          state: 'IDLE',
          outboundScheduledTripId: null,
          returnScheduledTripId: null,
          destinationCity: null,
          nextLongTripStartTime: null,
          restWindowStartsAt: null,
          lastTransitionReason: `abort: ${event.reason}`,
          updatedAt: now,
        }),
      );
    }

    switch (this.state) {
      case 'IDLE':
        if (event.kind === 'outbound_started') {
          return ok(
            this.copyWith({
              state: 'LONG_TRIP_OUTBOUND',
              outboundScheduledTripId: event.outboundScheduledTripId,
              lastTransitionReason: null,
              updatedAt: now,
            }),
          );
        }
        break;

      case 'LONG_TRIP_OUTBOUND':
        if (event.kind === 'outbound_completed') {
          const buffer = event.restBufferMinutes ?? this.restBufferMinutes;
          const restStartsAt = new Date(
            event.nextLongTripStartTime.getTime() - buffer * 60_000,
          );
          // Sanity: si el retorno empieza ya o antes del buffer, no entra
          // a AVAILABLE_LOCAL — directo a BLOCKED_REST (no hay ventana).
          const nextState: DriverHybridState =
            restStartsAt.getTime() <= now.getTime() ? 'BLOCKED_REST' : 'AVAILABLE_LOCAL';
          return ok(
            this.copyWith({
              state: nextState,
              destinationCity: event.destinationCity,
              returnScheduledTripId: event.returnScheduledTripId,
              nextLongTripStartTime: event.nextLongTripStartTime,
              restWindowStartsAt: restStartsAt,
              restBufferMinutes: buffer,
              lastTransitionReason: null,
              updatedAt: now,
            }),
          );
        }
        break;

      case 'AVAILABLE_LOCAL':
        if (event.kind === 'rest_window_entered') {
          return ok(
            this.copyWith({
              state: 'BLOCKED_REST',
              updatedAt: now,
            }),
          );
        }
        if (event.kind === 'return_cancelled') {
          return ok(
            this.copyWith({
              state: 'IDLE',
              outboundScheduledTripId: null,
              returnScheduledTripId: null,
              destinationCity: null,
              nextLongTripStartTime: null,
              restWindowStartsAt: null,
              lastTransitionReason: 'return_cancelled by passenger or ops',
              updatedAt: now,
            }),
          );
        }
        break;

      case 'BLOCKED_REST':
        if (event.kind === 'return_started') {
          return ok(
            this.copyWith({
              state: 'LONG_TRIP_RETURN',
              updatedAt: now,
            }),
          );
        }
        if (event.kind === 'return_cancelled') {
          return ok(
            this.copyWith({
              state: 'IDLE',
              outboundScheduledTripId: null,
              returnScheduledTripId: null,
              destinationCity: null,
              nextLongTripStartTime: null,
              restWindowStartsAt: null,
              lastTransitionReason: 'return_cancelled during rest',
              updatedAt: now,
            }),
          );
        }
        break;

      case 'LONG_TRIP_RETURN':
        if (event.kind === 'return_completed') {
          return ok(
            this.copyWith({
              state: 'IDLE',
              outboundScheduledTripId: null,
              returnScheduledTripId: null,
              destinationCity: null,
              nextLongTripStartTime: null,
              restWindowStartsAt: null,
              lastTransitionReason: null,
              updatedAt: now,
            }),
          );
        }
        break;
    }

    return err(new InvalidHybridTransitionError(this.state, event.kind));
  }

  /**
   * True si el driver está en una ventana donde puede aceptar carreras
   * locales (ride-hailing en la ciudad destino del intercity).
   */
  public isAcceptingLocalRides(): boolean {
    return this.state === 'AVAILABLE_LOCAL';
  }

  /**
   * Minutos restantes hasta restWindowStartsAt. Util para countdown UI.
   * Null si no estamos en AVAILABLE_LOCAL.
   */
  public minutesUntilRestWindow(now: Date = new Date()): number | null {
    if (this.state !== 'AVAILABLE_LOCAL' || !this.restWindowStartsAt) {
      return null;
    }
    const diffMs = this.restWindowStartsAt.getTime() - now.getTime();
    return Math.max(0, Math.floor(diffMs / 60_000));
  }

  /**
   * Determina si una carrera local propuesta cabe en el tiempo disponible
   * antes del retorno (carrera + buffer rest ≤ tiempo hasta retorno).
   * Llave del filtro de matching local. Devuelve false si no AVAILABLE_LOCAL.
   *
   * @param estimatedDurationMinutes  duración estimada de la carrera local
   *                                  (con tráfico actual)
   * @param now                       hora actual (inyectable)
   */
  public canAcceptLocalRide(
    estimatedDurationMinutes: number,
    now: Date = new Date(),
  ): boolean {
    if (this.state !== 'AVAILABLE_LOCAL') return false;
    if (!this.nextLongTripStartTime) return false;

    const minutesUntilReturn =
      (this.nextLongTripStartTime.getTime() - now.getTime()) / 60_000;
    const totalRequired = estimatedDurationMinutes + this.restBufferMinutes;
    return minutesUntilReturn >= totalRequired;
  }

  public toPrimitives(): DriverHybridContextProps {
    return {
      id: this.id,
      driverId: this.driverId,
      state: this.state,
      outboundScheduledTripId: this.outboundScheduledTripId,
      returnScheduledTripId: this.returnScheduledTripId,
      destinationCity: this.destinationCity,
      nextLongTripStartTime: this.nextLongTripStartTime,
      restWindowStartsAt: this.restWindowStartsAt,
      restBufferMinutes: this.restBufferMinutes,
      lastTransitionReason: this.lastTransitionReason,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  public static fromPrimitives(props: DriverHybridContextProps): DriverHybridContext {
    return new DriverHybridContext(props);
  }

  private copyWith(changes: Partial<DriverHybridContextProps>): DriverHybridContext {
    return new DriverHybridContext({
      ...this.toPrimitives(),
      ...changes,
    });
  }
}
