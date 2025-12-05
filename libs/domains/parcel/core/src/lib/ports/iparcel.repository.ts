import { Result } from 'neverthrow';
import { Parcel } from '../entities/parcel.entity';
import { UUID } from '@going-monorepo-clean/shared-domain';

// Injection token
export const I_PARCEL_REPOSITORY = Symbol('IParcelRepository');

// Repository interface (Port)
export interface IParcelRepository {
  save(parcel: Parcel): Promise<Result<void, Error>>;
  findById(id: UUID): Promise<Result<Parcel | null, Error>>;
  findByUserId(userId: UUID): Promise<Result<Parcel[], Error>>;
  findByDriverId(driverId: UUID): Promise<Result<Parcel[], Error>>;
  update(parcel: Parcel): Promise<Result<void, Error>>;
}
