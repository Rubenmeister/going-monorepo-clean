import { Result } from 'neverthrow';
import { Parcel } from '../entities/parcel.entity';
import { UUID } from '@going-monorepo-clean/shared-domain';
export declare const I_PARCEL_REPOSITORY: unique symbol;
export interface IParcelRepository {
    save(parcel: Parcel): Promise<Result<void, Error>>;
    findById(id: UUID): Promise<Result<Parcel | null, Error>>;
    findByUserId(userId: UUID): Promise<Result<Parcel[], Error>>;
    findByDriverId(driverId: UUID): Promise<Result<Parcel[], Error>>;
    update(parcel: Parcel): Promise<Result<void, Error>>;
}
