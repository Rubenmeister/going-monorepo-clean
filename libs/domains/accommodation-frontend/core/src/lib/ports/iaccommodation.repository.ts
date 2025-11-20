import { Result } from 'neverthrow';
import { Accommodation } from '../entities/accommodation.entity';
import { UUID } from '@going-monorepo-clean/shared-domain';

export interface SearchFilters {
  city?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
}

export const IAccommodationRepository = Symbol('IAccommodationRepository');

export interface IAccommodationRepository {
  search(filters: SearchFilters): Promise<Result<Accommodation[], Error>>;
  getById(id: UUID): Promise<Result<Accommodation | null, Error>>;
}