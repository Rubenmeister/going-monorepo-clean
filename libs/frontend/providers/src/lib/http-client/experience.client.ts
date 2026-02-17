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

export interface SearchExperiencesQuery {
  locationCity?: string;
  maxPrice?: number;
}

export class ExperienceClient {
  async createExperience(data: CreateExperienceRequest): Promise<{ id: string }> {
    return httpClient.post<{ id: string }>('/experiences', data);
  }

  async searchExperiences(query: SearchExperiencesQuery): Promise<Experience[]> {
    const params = new URLSearchParams();
    if (query.locationCity) params.append('locationCity', query.locationCity);
    if (query.maxPrice) params.append('maxPrice', query.maxPrice.toString());

    return httpClient.get<Experience[]>(
      `/experiences/search?${params.toString()}`
    );
  }
}

export const experienceClient = new ExperienceClient();
