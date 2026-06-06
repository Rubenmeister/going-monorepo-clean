import { Result, ok, err } from 'neverthrow';
import type { ITourRepository, Tour, TourFilters } from '@going-monorepo-clean/domains-tour-frontend-core';

const API_BASE = process.env['NX_API_URL'] || '/api';

export class HttpTourRepository implements ITourRepository {
  async searchPublished(filters: TourFilters): Promise<Result<Tour[], Error>> {
    const params = new URLSearchParams();
    if (filters.city) params.set('city', filters.city);
    if (filters.category) params.set('category', filters.category);
    if (filters.maxPrice) params.set('maxPrice', String(filters.maxPrice));
    const res = await fetch(`${API_BASE}/tours?${params}`);
    if (!res.ok) return err(new Error(`Error al buscar tours: ${res.status}`));
    return ok(await res.json());
  }

  async findById(id: string): Promise<Result<Tour | null, Error>> {
    const res = await fetch(`${API_BASE}/tours/${id}`);
    if (!res.ok) return err(new Error(`Error al obtener tour: ${res.status}`));
    return ok(await res.json());
  }
}
