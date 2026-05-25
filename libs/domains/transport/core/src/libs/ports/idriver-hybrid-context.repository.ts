import { Result } from 'neverthrow';
import {
  DriverHybridContext,
  DriverHybridState,
} from '../entities/driver-hybrid-context.entity';
import { UUID } from '@going-monorepo-clean/shared-domain';

export const IDriverHybridContextRepository = Symbol(
  'IDriverHybridContextRepository',
);

/**
 * Repositorio de DriverHybridContext.
 *
 * Persistencia mínima: cada driver tiene COMO MUCHO un contexto activo
 * (state != IDLE) a la vez. Los contextos finalizados (state=IDLE)
 * quedan en la collection para auditoría histórica.
 *
 * El repository es agnóstico de la state machine — solo persiste lo que
 * el caller (use cases / cron) le pasa. La validación de transiciones
 * vive en la entity (`DriverHybridContext.transition`).
 *
 * Concurrency note: las queries `findReadyForRestWindow` /
 * `findReadyForReturn` son usadas por un cron cada 1 min. Si dos pods
 * de transport-service corren en paralelo, ambos podrían intentar
 * disparar la misma transición — el caller debe ser idempotente
 * (revalidar el estado actual antes de transition).
 */
export interface IDriverHybridContextRepository {
  /**
   * Upsert por id. Si el ctx.state pasa a IDLE puede dejarse en la
   * collection como entrada histórica (no se borra automáticamente).
   */
  save(ctx: DriverHybridContext): Promise<Result<void, Error>>;

  /** Busca por su id propio. */
  findById(id: UUID): Promise<Result<DriverHybridContext | null, Error>>;

  /**
   * Devuelve el contexto ACTIVO (state != IDLE) del driver, o null si
   * no tiene ninguno. Es el lookup principal del matching engine.
   */
  findActiveByDriverId(
    driverId: UUID,
  ): Promise<Result<DriverHybridContext | null, Error>>;

  /**
   * Devuelve contextos en cualquiera de los estados dados. Para
   * dashboards / ops vistas.
   */
  findByStates(
    states: DriverHybridState[],
    opts?: { limit?: number },
  ): Promise<Result<DriverHybridContext[], Error>>;

  /**
   * Cron de transición automática AVAILABLE_LOCAL → BLOCKED_REST:
   * devuelve contextos en AVAILABLE_LOCAL cuyo restWindowStartsAt
   * ya pasó.
   */
  findReadyForRestWindow(
    now: Date,
  ): Promise<Result<DriverHybridContext[], Error>>;

  /**
   * Cron de transición automática BLOCKED_REST → LONG_TRIP_RETURN:
   * devuelve contextos en BLOCKED_REST cuyo nextLongTripStartTime
   * ya pasó.
   */
  findReadyForReturn(
    now: Date,
  ): Promise<Result<DriverHybridContext[], Error>>;
}
