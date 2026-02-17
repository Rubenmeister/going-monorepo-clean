import { httpClient } from './http.client';

export interface Location {
  address: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
}

export interface CreateExperienceRequest {
  hostId: string;
  title: string;
  description: string;
  location: Location;
  price: {
    amount: number;
    currency: string;
  };
  durationHours: number;
}

export interface Experience {
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
  createdAt: string;
}

export class ExperienceClient {
  async createExperience(data: CreateExperienceRequest): Promise<{ id: string }> {
    return httpClient.post<{ id: string }>('/experiences', data);
  }

  // TODO: Add searchExperiences when backend implements it
}

export const experienceClient = new ExperienceClient();
