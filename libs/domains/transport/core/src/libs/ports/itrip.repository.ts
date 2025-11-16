import { Result } from 'neverthrow';
import { Trip } from '../entities/trip.entity';
import { UUID } from '@going-monorepo-clean/shared-domain';

// Symbol para inyección de dependencias
export const ITripRepository = Symbol('ITripRepository');

export interface ITripRepository {
  save(trip: Trip): Promise<Result<void, Error>>;
  update(trip: Trip): Promise<Result<void, Error>>;
  findById(id: UUID): Promise<Result<Trip | null, Error>>;
  findActiveTripsByDriver(driverId: UUID): Promise<Result<Trip[], Error>>;
  findTripsByUser(userId: UUID): Promise<Result<Trip[], Error>>;
  findPendingTrips(): Promise<Result<Trip[], Error>>;
}