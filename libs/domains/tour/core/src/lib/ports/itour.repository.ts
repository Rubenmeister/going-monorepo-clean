import { Tour } from '../entities/tour.entity';

export const ITourRepository = Symbol('ITourRepository');

export interface ITourRepository {
  save(tour: Tour): Promise<void>;
  findById(id: string): Promise<Tour | null>;
  findByHostId(hostId: string): Promise<Tour[]>;
  search(filters: { location?: string; minPrice?: number; maxPrice?: number }): Promise<Tour[]>;
  update(tour: Tour): Promise<void>;
}
