import { Result, ok, err } from 'neverthrow';
import type { IAccommodationRepository, Accommodation, AccommodationFilters } from '@going-monorepo-clean/domains-accommodation-frontend-core';

const API_BASE = process.env['NX_API_URL'] || '/api';

export class HttpAccommodationRepository implements IAccommodationRepository {
  async search(filters: AccommodationFilters): Promise<Result<Accommodation[], Error>> {
    const params = new URLSearchParams();
    if (filters.city) params.set('city', filters.city);
    if (filters.guests) params.set('guests', String(filters.guests));
    if (filters.checkIn) params.set('checkIn', filters.checkIn.toISOString());
    if (filters.checkOut) params.set('checkOut', filters.checkOut.toISOString());
    const res = await fetch(`${API_BASE}/accommodations?${params}`);
    if (!res.ok) return err(new Error(`Error al buscar alojamientos: ${res.status}`));
    return ok(await res.json());
  }

  async getById(id: string): Promise<Result<Accommodation | null, Error>> {
    const res = await fetch(`${API_BASE}/accommodations/${id}`);
    if (!res.ok) return err(new Error(`Error al obtener alojamiento: ${res.status}`));
    return ok(await res.json());
  }
}
