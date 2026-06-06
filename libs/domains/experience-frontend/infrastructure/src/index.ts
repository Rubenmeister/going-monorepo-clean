import { Result, ok, err } from 'neverthrow';
import type { IExperienceRepository, Experience, ExperienceFilters } from '@going-monorepo-clean/domains-experience-frontend-core';

const API_BASE = process.env['NX_API_URL'] || '/api';

export class HttpExperienceRepository implements IExperienceRepository {
  async search(filters: ExperienceFilters): Promise<Result<Experience[], Error>> {
    const params = new URLSearchParams();
    if (filters.city) params.set('city', filters.city);
    if (filters.category) params.set('category', filters.category);
    if (filters.maxPrice) params.set('maxPrice', String(filters.maxPrice));
    const res = await fetch(`${API_BASE}/experiences?${params}`);
    if (!res.ok) return err(new Error(`Error al buscar experiencias: ${res.status}`));
    return ok(await res.json());
  }

  async findById(id: string): Promise<Result<Experience | null, Error>> {
    const res = await fetch(`${API_BASE}/experiences/${id}`);
    if (!res.ok) return err(new Error(`Error al obtener experiencia: ${res.status}`));
    return ok(await res.json());
  }
}
