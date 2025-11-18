import { Result } from 'neverthrow';
import { Tour } from '../entities/tour.entity';
import { UUID } from '@going-monorepo-clean/shared-domain';

export interface TourFilters {
  city?: string;
  category?: string;
}

export const ITourRepository = Symbol('ITourRepository');

export interface ITourRepository {
  search(filters: TourFilters): Promise<Result<Tour[], Error>>;
  getById(id: UUID): Promise<Result<Tour | null, Error>>;
}