import { Result } from 'neverthrow';
import { RideRequest } from '../entities/ride-request.entity';
import { UUID } from '@going-monorepo-clean/shared-domain';

export const IRideRequestRepository = Symbol('IRideRequestRepository');

export interface IRideRequestRepository {
  save(request: RideRequest): Promise<Result<void, Error>>;
  update(request: RideRequest): Promise<Result<void, Error>>;
  findById(id: UUID): Promise<Result<RideRequest | null, Error>>;
  findByPassengerId(passengerId: UUID): Promise<Result<RideRequest[], Error>>;
  findPendingByPriority(): Promise<Result<RideRequest[], Error>>;
  findActiveByPassenger(passengerId: UUID): Promise<Result<RideRequest | null, Error>>;
}
