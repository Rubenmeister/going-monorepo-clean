import { Result } from 'neverthrow';
import { Trip } from '../entities/trip.entity';
import { UUID, Location } from '@going-monorepo-clean/shared-domain';

export const ITripRepository = Symbol('ITripRepository');

export interface ITripRepository {
  save(trip: Trip): Promise<Result<void, Error>>;
  findById(id: UUID): Promise<Result<Trip, Error>>;
  findAvailableSharedTrips(origin: Location, dest: Location, vehicleType: 'SUV' | 'VAN'): Promise<Trip[]>;
  findTripsByDriverId(driverId: string): Promise<Trip[]>;
  findAll(): Promise<Result<Trip[], Error>>;
  delete(id: UUID): Promise<Result<void, Error>>;
}