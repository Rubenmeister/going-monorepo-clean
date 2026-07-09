import { Result } from 'neverthrow';
import { Booking } from '../entities/booking.entity';
import { UUID } from '@going-monorepo-clean/shared-domain';

export interface IBookingRepository {
  save(booking: Booking): Promise<Result<void, Error>>;
  /**
   * Guarda una ocurrencia de recurrente con clave de idempotencia (auditoría #12).
   * true = creado; false = ya existía (dedup por recurrenceKey).
   */
  saveExpanded(booking: Booking, recurrenceKey: string): Promise<Result<boolean, Error>>;
  update(booking: Booking): Promise<Result<void, Error>>;
  findById(id: UUID): Promise<Result<Booking | null, Error>>;
  findByUserId(userId: UUID): Promise<Result<Booking[], Error>>;
  /**
   * Reservas de una empresa corporativa (usadas por corporate-service para
   * stats, presupuesto, factura mensual). Filtros opcionales por estado y
   * paginación skip/limit.
   */
  findByCompany(
    companyId: UUID,
    opts?: { status?: string; limit?: number; skip?: number },
  ): Promise<Result<Booking[], Error>>;
  /**
   * Bookings transport listos para ser disparados como rides reales por el
   * BookingDispatcher cron.
   *
   * Criterios:
   *   - serviceType = 'transport'
   *   - status in ('pending', 'confirmed')
   *   - startDate <= beforeDate (típicamente now + threshold de 15-30 min)
   *   - triggeredRideId == null (no disparado todavía — idempotencia)
   *
   * Ordenado por startDate asc para procesar primero los más urgentes.
   */
  findDispatchReady(beforeDate: Date, limit?: number): Promise<Result<Booking[], Error>>;
  /**
   * Claim atómico para despacho (auditoría B1 #13). true = este proceso ganó y
   * debe despachar; false = otro pod ya lo tomó (saltar). Evita rides duplicados.
   */
  claimForDispatch(bookingId: UUID): Promise<Result<boolean, Error>>;
  /** Libera el lock de despacho (al fallar) para permitir reintento. */
  releaseDispatch(bookingId: UUID): Promise<Result<void, Error>>;
  /**
   * Listar TODAS las reservas (uso admin / panel). Filtro opcional por estado
   * y paginación. No filtra por empresa ni usuario — solo lo usa el admin.
   */
  findAll(opts: { status?: string; limit: number; skip: number }): Promise<Result<Booking[], Error>>;
}

export const IBookingRepository = Symbol('IBookingRepository');
