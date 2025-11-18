import { Result } from 'neverthrow';
import { Booking, ServiceType } from '../entities/booking.entity';
import { UUID, Money, Location } from '@going-monorepo-clean/shared-domain';

// DTO para crear una nueva reserva
export interface CreateBookingData {
  userId: UUID;
  serviceId: UUID;
  serviceType: ServiceType;
  totalPrice: Money;
  startDate: Date;
  endDate?: Date;
}

// Symbol para inyección de dependencias
export const IBookingRepository = Symbol('IBookingRepository');

export interface IBookingRepository {
  /**
   * Intenta crear una nueva reserva llamando al API Gateway
   */
  create(data: CreateBookingData, token: string): Promise<Result<Booking, Error>>;
  
  /**
   * Obtiene todas las reservas de un usuario
   */
  getByUser(userId: UUID, token: string): Promise<Result<Booking[], Error>>;
}