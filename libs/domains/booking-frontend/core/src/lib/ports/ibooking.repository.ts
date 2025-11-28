import { Booking } from '../entities/booking.entity';

export interface IBookingRepository {
  save(booking: Booking): Promise<void>;
  findById(id: string): Promise<Booking | null>;
  findByUser(userId: string): Promise<Booking[]>;
}