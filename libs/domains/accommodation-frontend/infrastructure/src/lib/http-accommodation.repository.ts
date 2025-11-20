import { Result, ok, err } from 'neverthrow';
import {
  Accommodation,
  IAccommodationRepository,
  SearchFilters
} from '@going-monorepo-clean/domains-accommodation-frontend-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

const API_GATEWAY = 'http://localhost:3000/api';

export class HttpAccommodationRepository implements IAccommodationRepository {
  
  async search(filters: SearchFilters): Promise<Result<Accommodation[], Error>> {
    try {
      const params = new URLSearchParams(filters as any);
      
      const response = await fetch(`${API_GATEWAY}/accommodations/search?${params}`);
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.message);
      
      return ok(data.map((item: any) => Accommodation.fromPrimitives(item)));
    } catch (error) {
      return err(new Error(error.message || 'Error de red al buscar alojamientos'));
    }
  }

  async getById(id: UUID): Promise<Result<Accommodation | null, Error>> {
    try {
      const response = await fetch(`${API_GATEWAY}/accommodations/${id}`);
      if (response.status === 404) return ok(null);
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      return ok(Accommodation.fromPrimitives(data));
    } catch (error) {
      return err(new Error(error.message || 'Error de red al obtener alojamiento'));
    }
  }
}