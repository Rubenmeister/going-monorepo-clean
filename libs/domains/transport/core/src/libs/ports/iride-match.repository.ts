import { Result } from 'neverthrow';
import { RideMatch } from '../entities/ride-match.entity';
import { UUID } from '@going-monorepo-clean/shared-domain';

export const IRideMatchRepository = Symbol('IRideMatchRepository');

export interface IRideMatchRepository {
  // Match operations
  save(match: RideMatch): Promise<Result<void, Error>>;
  update(match: RideMatch): Promise<Result<void, Error>>;
  findById(matchId: UUID): Promise<Result<RideMatch | null, Error>>;

  // Query operations
  findByRideId(rideId: UUID): Promise<Result<RideMatch[], Error>>;
  findPendingByRideId(rideId: UUID): Promise<Result<RideMatch[], Error>>;
  findByDriverId(
    driverId: UUID,
    status?: string
  ): Promise<Result<RideMatch[], Error>>;

  // Availability queries
  findAvailableMatches(
    rideId: UUID,
    limit: number
  ): Promise<Result<RideMatch[], Error>>;

  // Expiry management
  expireOldMatches(rideId: UUID): Promise<Result<number, Error>>;
  deleteExpiredMatches(olderThan: Date): Promise<Result<number, Error>>;

  // Count operations
  countPendingForRide(rideId: UUID): Promise<Result<number, Error>>;
  countAcceptedForDriver(driverId: UUID): Promise<Result<number, Error>>;
}
