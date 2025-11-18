import { Result, ok, err } from 'neverthrow';
import {
  Tour,
  ITourRepository,
  TourFilters
} from '@going-monorepo-clean/domains-tour-frontend-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

const API_GATEWAY = 'http://localhost:3000/api';

export class HttpTourRepository implements ITourRepository {
  
  async search(filters: TourFilters): Promise<Result<Tour[], Error>> {
    try {
      const params = new URLSearchParams();
      if (filters.city) params.append('locationCity', filters.city);
      if (filters.category) params.append('category', filters.category);
      
      const response = await fetch(`${API_GATEWAY}/tours/search?${params}`);
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.message);
      
      return ok(data.map((item: any) => Tour.fromPrimitives(item)));
    } catch (error) {
      return err(error);
    }
  }

  async getById(id: UUID): Promise<Result<Tour | null, Error>> {
    try {
      const response = await fetch(`${API_GATEWAY}/tours/${id}`);
      if (response.status === 404) return ok(null);
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      return ok(Tour.fromPrimitives(data));
    } catch (error) {
      return err(error);
    }
  }
}