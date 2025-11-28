import { Result } from 'neverthrow';
import { Parcel, IParcelRepository, CreateParcelData } from '@going-monorepo-clean/domains-parcel-frontend-core';
import { UUID } from '@going-monorepo-clean/shared-domain';
export declare class HttpParcelRepository implements IParcelRepository {
    create(data: CreateParcelData, token: string): Promise<Result<Parcel, Error>>;
    getByUser(userId: UUID, token: string): Promise<Result<Parcel[], Error>>;
    getTrackingStatus(parcelId: UUID, token: string): Promise<Result<Parcel, Error>>;
}
