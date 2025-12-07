import { Booking } from '../entities/booking.entity';
import { Result } from 'neverthrow';

export const I_BOOKING_REPOSITORY = Symbol('IBookingRepository');

export interface IBookingRepository {
  save(booking: Booking): Promise<Result<void, Error>>;
  findById(id: string): Promise<Result<Booking | null, Error>>;
  findByUserId(userId: string): Promise<Result<Booking[], Error>>;
  update(booking: Booking): Promise<Result<void, Error>>;
  findByType(type: string, userId?: string): Promise<Result<Booking[], Error>>;
}