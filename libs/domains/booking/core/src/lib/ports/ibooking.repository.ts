import { Result } from 'neverthrow';
import { Booking } from '../entities/booking.entity';

// 1. Definimos la interfaz (Contrato)
export interface IBookingRepository {
  save(booking: Booking): Promise<Result<void, Error>>;
  findById(id: string): Promise<Result<Booking | null, Error>>;
}

// 2. Definimos un TOKEN para NestJS (Truco para inyectar interfaces)
export const IBookingRepository = Symbol('IBookingRepository');