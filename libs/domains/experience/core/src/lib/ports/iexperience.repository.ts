import { Result } from 'neverthrow';
import { Experience } from '../entities/experience.entity';
import { UUID } from '@going-monorepo-clean/shared-domain';

export const IExperienceRepository = Symbol('IExperienceRepository');

export interface ExperienceSearchFilters {
  locationCity?: string;
  maxPrice?: number;
}

export interface IExperienceRepository {
  save(experience: Experience): Promise<Result<void, Error>>;
  update(experience: Experience): Promise<Result<void, Error>>;
  findById(id: UUID): Promise<Result<Experience | null, Error>>;
  findByHostId(hostId: UUID): Promise<Result<Experience[], Error>>;
  searchPublished(filters: ExperienceSearchFilters): Promise<Result<Experience[], Error>>;
}