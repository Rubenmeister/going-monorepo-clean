import { Result } from 'neverthrow';
import { Booking, ServiceType } from '../entities/booking.entity';
import { UUID } from '@going-monorepo-clean/shared-domain';

// Symbol para inyección de dependencias
export const IBookingRepository = Symbol('IBookingRepository');

export interface IBookingRepository {
  save(booking: Booking): Promise<Result<void, Error>>;
  update(booking: Booking): Promise<Result<void, Error>>;
  findById(id: UUID): Promise<Result<Booking | null, Error>>;
  findByUserId(userId: UUID): Promise<Result<Booking[], Error>>;
  findByServiceId(serviceId: UUID, serviceType: ServiceType): Promise<Result<Booking[], Error>>;
}
