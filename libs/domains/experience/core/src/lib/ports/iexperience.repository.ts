import { Result } from 'neverthrow';
import { Experience } from '../entities/experience.entity';

// Injection token
export const I_EXPERIENCE_REPOSITORY = Symbol('IExperienceRepository');

// Search filters interface
export interface ExperienceSearchFilters {
  location?: string;
  locationCity?: string;
  minPrice?: number;
  maxPrice?: number;
  hostId?: string;
}

// Repository interface (Port) - using Result pattern for error handling
export interface IExperienceRepository {
  save(experience: Experience): Promise<Result<void, Error>>;
  update(experience: Experience): Promise<Result<void, Error>>;
  findById(id: string): Promise<Result<Experience | null, Error>>;
  findByHostId(hostId: string): Promise<Result<Experience[], Error>>;
  searchPublished(filters: ExperienceSearchFilters): Promise<Result<Experience[], Error>>;
}