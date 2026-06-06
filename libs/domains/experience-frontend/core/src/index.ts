import { Result } from 'neverthrow';

export interface Experience {
  id: string;
  title: string;
  description: string;
  location: { city: string; country: string };
  price: { amount: number; currency: string };
  durationHours: number;
  category: string;
  images: string[];
  rating: number;
}

export interface ExperienceFilters {
  city?: string;
  category?: string;
  maxPrice?: number;
}

export const IExperienceRepository = Symbol('IExperienceRepository');

export interface IExperienceRepository {
  search(filters: ExperienceFilters): Promise<Result<Experience[], Error>>;
  findById(id: string): Promise<Result<Experience | null, Error>>;
}
