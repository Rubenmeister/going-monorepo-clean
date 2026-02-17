import { httpClient } from './http.client';

export interface Location {
  address: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
}

export interface CreateTourRequest {
  hostId: string;
  title: string;
  description: string;
  location: Location;
  price: {
    amount: number;
    currency: string;
  };
  durationHours: number;
  maxGuests: number;
  category: string;
}

export interface Tour {
  id: string;
  hostId: string;
  title: string;
  description: string;
  location: Location;
  price: {
    amount: number;
    currency: string;
  };
  durationHours: number;
  maxGuests: number;
  category: string;
  createdAt: string;
}

export interface SearchToursQuery {
  locationCity?: string;
  category?: string;
  maxPrice?: number;
}

export class TourClient {
  async createTour(data: CreateTourRequest): Promise<{ id: string }> {
    return httpClient.post<{ id: string }>('/tours', data);
  }

  async searchTours(query: SearchToursQuery): Promise<Tour[]> {
    const params = new URLSearchParams();
    if (query.locationCity) params.append('locationCity', query.locationCity);
    if (query.category) params.append('category', query.category);
    if (query.maxPrice) params.append('maxPrice', query.maxPrice.toString());

    return httpClient.get<Tour[]>(
      `/tours/search?${params.toString()}`
    );
  }
}

export const tourClient = new TourClient();
