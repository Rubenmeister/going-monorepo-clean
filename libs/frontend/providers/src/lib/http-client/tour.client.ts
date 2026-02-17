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

export class TourClient {
  async createTour(data: CreateTourRequest): Promise<{ id: string }> {
    return httpClient.post<{ id: string }>('/tours', data);
  }

  // TODO: Add searchTours when backend implements it
}

export const tourClient = new TourClient();
