import { Result } from 'neverthrow';
import { Accommodation } from '../entities/accommodation.entity';
import { UUID } from '@going-monorepo-clean/shared-domain';

export interface SearchFilters {
  city?: string;
  country?: string;
  capacity?: number;
}

export const IAccommodationRepository = Symbol('IAccommodationRepository');

export interface IAccommodationRepository {
  save(accommodation: Accommodation): Promise<Result<void, Error>>;
  update(accommodation: Accommodation): Promise<Result<void, Error>>;
  findById(id: UUID): Promise<Result<Accommodation | null, Error>>;
  findByHostId(hostId: UUID): Promise<Result<Accommodation[], Error>>;
  search(filters: SearchFilters): Promise<Result<Accommodation[], Error>>;
}