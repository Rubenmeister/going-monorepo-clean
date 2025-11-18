import { Result } from 'neverthrow';
import { Trip } from '../entities/trip.entity';
import { UUID, Money, Location } from '@going-monorepo-clean/shared-domain';

// DTO para crear un nuevo viaje
export interface RequestTripData {
  userId: UUID;
  origin: Location;
  destination: Location;
  price: Money;
}

// Symbol para inyección de dependencias
export const ITripRepository = Symbol('ITripRepository');

export interface ITripRepository {
  /**
   * Intenta crear un nuevo viaje llamando al API Gateway
   */
  request(data: RequestTripData, token: string): Promise<Result<Trip, Error>>;
  
  /**
   * Obtiene el viaje activo de un usuario (si existe)
   */
  getActiveTrip(userId: UUID, token: string): Promise<Result<Trip | null, Error>>;

  /**
   * Cancela un viaje
   */
  cancel(tripId: UUID, token: string): Promise<Result<void, Error>>;
}