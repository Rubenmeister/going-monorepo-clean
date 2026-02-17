import { Result } from 'neverthrow';
import { UUID } from '@going-monorepo-clean/shared-domain';
import { LocationHistory } from '../entities/location-history.entity';

export const ILocationHistoryRepository = Symbol('ILocationHistoryRepository');

export interface ILocationHistoryRepository {
  /** Persists a location history record (MongoDB) */
  save(record: LocationHistory): Promise<Result<void, Error>>;

  /** Saves multiple records in batch */
  saveBatch(records: LocationHistory[]): Promise<Result<void, Error>>;

  /** Finds all location records for a driver within a time range */
  findByDriverId(
    driverId: UUID,
    from: Date,
    to: Date,
  ): Promise<Result<LocationHistory[], Error>>;

  /** Finds all location records associated with a specific trip */
  findByTripId(tripId: UUID): Promise<Result<LocationHistory[], Error>>;

  /** Returns the last known location for a driver from persistent storage */
  findLastByDriverId(driverId: UUID): Promise<Result<LocationHistory | null, Error>>;
}
