import { Result } from 'neverthrow';

export interface Tour {
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

export interface TourFilters {
  city?: string;
  category?: string;
  maxPrice?: number;
}

export const ITourRepository = Symbol('ITourRepository');

export interface ITourRepository {
  searchPublished(filters: TourFilters): Promise<Result<Tour[], Error>>;
  findById(id: string): Promise<Result<Tour | null, Error>>;
}
