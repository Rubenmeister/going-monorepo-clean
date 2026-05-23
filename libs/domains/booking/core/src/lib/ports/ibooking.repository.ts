import { Result } from 'neverthrow';
import { Booking } from '../entities/booking.entity';
import { UUID } from '@going-monorepo-clean/shared-domain';

export interface IBookingRepository {
  save(booking: Booking): Promise<Result<void, Error>>;
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
}

export const IBookingRepository = Symbol('IBookingRepository');
