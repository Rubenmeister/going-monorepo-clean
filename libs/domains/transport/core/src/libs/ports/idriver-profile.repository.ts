import { Result } from 'neverthrow';
import { DriverProfile } from '../entities/driver-profile.entity';
import { UUID } from '@going-monorepo-clean/shared-domain';

export const IDriverProfileRepository = Symbol('IDriverProfileRepository');

export interface IDriverProfileRepository {
  save(profile: DriverProfile): Promise<Result<void, Error>>;
  update(profile: DriverProfile): Promise<Result<void, Error>>;
  findById(id: UUID): Promise<Result<DriverProfile | null, Error>>;
  findByUserId(userId: UUID): Promise<Result<DriverProfile | null, Error>>;
  findActiveDrivers(): Promise<Result<DriverProfile[], Error>>;
}
