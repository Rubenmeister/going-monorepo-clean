import { Result } from 'neverthrow';
import { Parcel } from '../entities/parcel.entity';
import { UUID } from '@going-monorepo-clean/shared-domain';

// Symbol para inyección de dependencias
export const IParcelRepository = Symbol('IParcelRepository');

export interface IParcelRepository {
  save(parcel: Parcel): Promise<Result<void, Error>>;
  update(parcel: Parcel): Promise<Result<void, Error>>;
  findById(id: UUID): Promise<Result<Parcel | null, Error>>;
  findByUserId(userId: UUID): Promise<Result<Parcel[], Error>>;
  findByDriverId(driverId: UUID): Promise<Result<Parcel[], Error>>;
  findByTrackingCode(trackingCode: string): Promise<Result<Parcel | null, Error>>;
  /** Adjunta la foto del paquete (data URL) sin pasar por la entidad de dominio. */
  setPackagePhoto(id: UUID, packagePhotoUrl: string): Promise<Result<void, Error>>;
}
