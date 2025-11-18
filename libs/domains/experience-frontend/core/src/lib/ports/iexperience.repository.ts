import { Result } from 'neverthrow';
import { Experience } from '../entities/experience.entity';
import { UUID } from '@going-monorepo-clean/shared-domain';

export interface ExperienceFilters {
  city?: string;
  maxPrice?: number;
}

export const IExperienceRepository = Symbol('IExperienceRepository');

export interface IExperienceRepository {
  search(filters: ExperienceFilters): Promise<Result<Experience[], Error>>;
  getById(id: UUID): Promise<Result<Experience | null, Error>>;
}