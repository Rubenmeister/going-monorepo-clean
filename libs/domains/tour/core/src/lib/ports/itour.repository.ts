import { Result } from 'neverthrow';
import { Tour, TourCategory } from '../entities/tour.entity';
import { UUID } from '@going-monorepo-clean/shared-domain';

export const ITourRepository = Symbol('ITourRepository');

export interface TourSearchFilters {
  locationCity?: string;
  category?: TourCategory;
  maxPrice?: number;
}

export interface ITourRepository {
  save(tour: Tour): Promise<Result<void, Error>>;
  update(tour: Tour): Promise<Result<void, Error>>;
  findById(id: UUID): Promise<Result<Tour | null, Error>>;
  findByHostId(hostId: UUID): Promise<Result<Tour[], Error>>;
  searchPublished(filters: TourSearchFilters): Promise<Result<Tour[], Error>>;
}