import { Result, ok, err } from 'neverthrow';
import {
  Experience,
  IExperienceRepository,
  ExperienceFilters
} from '@going-monorepo-clean/domains-experience-frontend-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

const API_GATEWAY = 'http://localhost:3000/api';

export class HttpExperienceRepository implements IExperienceRepository {
  
  async search(filters: ExperienceFilters): Promise<Result<Experience[], Error>> {
    try {
      const params = new URLSearchParams(filters as any);
      
      const response = await fetch(`${API_GATEWAY}/experiences/search?${params}`);
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.message);
      
      return ok(data.map((item: any) => Experience.fromPrimitives(item)));
    } catch (error) {
      return err(new Error(error.message || 'Error de red al buscar experiencias'));
    }
  }

  async getById(id: UUID): Promise<Result<Experience | null, Error>> {
    try {
      const response = await fetch(`${API_GATEWAY}/experiences/${id}`);
      if (response.status === 404) return ok(null);
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      return ok(Experience.fromPrimitives(data));
    } catch (error) {
      return err(new Error(error.message || 'Error de red al obtener experiencia'));
    }
  }
}