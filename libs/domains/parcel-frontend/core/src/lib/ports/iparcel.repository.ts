import { Result } from 'neverthrow';
import { Parcel } from '../entities/parcel.entity';
import { UUID, Money, Location } from '@going-monorepo-clean/shared-domain';

// DTO para crear un nuevo envío
export interface CreateParcelData {
  userId: UUID;
  origin: Location;
  destination: Location;
  description: string;
  price: Money;
}

export const IParcelRepository = Symbol('IParcelRepository');

export interface IParcelRepository {
  /**
   * Intenta crear un nuevo envío llamando al API Gateway
   */
  create(data: CreateParcelData, token: string): Promise<Result<Parcel, Error>>;
  
  /**
   * Obtiene todos los envíos de un usuario
   */
  getByUser(userId: UUID, token: string): Promise<Result<Parcel[], Error>>;

  /**
   * Rastrea un envío específico
   */
  getTrackingStatus(parcelId: UUID, token: string): Promise<Result<Parcel, Error>>;
}