import { Result } from 'neverthrow';

export interface Accommodation {
  id: string;
  title: string;
  description: string;
  location: { city: string; country: string };
  pricePerNight: { amount: number; currency: string };
  images: string[];
  rating: number;
}

export interface AccommodationFilters {
  city?: string;
  checkIn?: Date;
  checkOut?: Date;
  guests?: number;
}

export const IAccommodationRepository = Symbol('IAccommodationRepository');

export interface IAccommodationRepository {
  search(filters: AccommodationFilters): Promise<Result<Accommodation[], Error>>;
  getById(id: string): Promise<Result<Accommodation | null, Error>>;
}
