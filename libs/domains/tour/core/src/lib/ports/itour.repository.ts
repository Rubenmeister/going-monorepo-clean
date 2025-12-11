import { Tour } from '../entities/tour.entity';
import { Result } from 'neverthrow';

export const I_TOUR_REPOSITORY = Symbol('ITourRepository');

export abstract class ITourRepository {
  abstract save(tour: Tour): Promise<Result<void, Error>>;
  abstract findById(id: string): Promise<Result<Tour | null, Error>>;
  abstract findByHostId(hostId: string): Promise<Result<Tour[], Error>>;
  abstract update(tour: Tour): Promise<Result<void, Error>>;
  abstract findByStatus(status: string): Promise<Result<Tour[], Error>>;
}
