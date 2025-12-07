import { Tour } from '../entities/tour.entity';
import { Result } from 'neverthrow';

export const I_TOUR_REPOSITORY = Symbol('ITourRepository');

export interface ITourRepository {
  save(tour: Tour): Promise<Result<void, Error>>;
  findById(id: string): Promise<Result<Tour | null, Error>>;
  findByHostId(hostId: string): Promise<Result<Tour[], Error>>;
  update(tour: Tour): Promise<Result<void, Error>>;
  findByStatus(status: string): Promise<Result<Tour[], Error>>;
}
