import { Result } from 'neverthrow';
import { Booking } from '../entities/booking.entity';
import { UUID } from '@going-monorepo-clean/shared-domain';

export interface IBookingRepository {
  save(booking: Booking): Promise<Result<void, Error>>;
  findById(id: UUID): Promise<Result<Booking | null, Error>>;
  findByUserId(userId: UUID): Promise<Result<Booking[], Error>>;
}

export const IBookingRepository = Symbol('IBookingRepository');
