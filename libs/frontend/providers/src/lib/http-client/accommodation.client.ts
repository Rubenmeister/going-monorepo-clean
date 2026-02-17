import { httpClient } from './http.client';

export interface Location {
  address: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
}

export interface CreateAccommodationRequest {
  hostId: string;
  title: string;
  description: string;
  location: Location;
  pricePerNight: {
    amount: number;
    currency: string;
  };
  capacity: number;
  amenities?: string[];
}

export interface SearchAccommodationsQuery {
  city?: string;
  country?: string;
  capacity?: number;
}

export interface Accommodation {
  id: string;
  hostId: string;
  title: string;
  description: string;
  location: Location;
  pricePerNight: {
    amount: number;
    currency: string;
  };
  capacity: number;
  amenities?: string[];
  createdAt: string;
}

export class AccommodationClient {
  async createAccommodation(
    data: CreateAccommodationRequest
  ): Promise<{ id: string }> {
    return httpClient.post<{ id: string }>('/accommodations', data);
  }

  async searchAccommodations(
    query: SearchAccommodationsQuery
  ): Promise<Accommodation[]> {
    const params = new URLSearchParams();
    if (query.city) params.append('city', query.city);
    if (query.country) params.append('country', query.country);
    if (query.capacity) params.append('capacity', query.capacity.toString());

    return httpClient.get<Accommodation[]>(
      `/accommodations/search?${params.toString()}`
    );
  }
}

export const accommodationClient = new AccommodationClient();
