import { Result, ok, err } from 'neverthrow';
import type { ITripRepository, Trip, TripRequest } from '@going-monorepo-clean/domains-transport-frontend-core';

const API_BASE = process.env['NX_API_URL'] || '/api';

export class HttpTripRepository implements ITripRepository {
  async requestTrip(data: TripRequest, token: string): Promise<Result<Trip, Error>> {
    const res = await fetch(`${API_BASE}/trips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    if (!res.ok) return err(new Error(`Error al solicitar viaje: ${res.status}`));
    return ok(await res.json());
  }

  async getActiveTrip(userId: string, token: string): Promise<Result<Trip | null, Error>> {
    const res = await fetch(`${API_BASE}/trips/active?userId=${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return err(new Error(`Error al obtener viaje activo: ${res.status}`));
    const data = await res.json();
    return ok(data || null);
  }

  async findById(id: string, token: string): Promise<Result<Trip | null, Error>> {
    const res = await fetch(`${API_BASE}/trips/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return err(new Error(`Error al obtener viaje: ${res.status}`));
    return ok(await res.json());
  }

  async findByUserId(userId: string, token: string): Promise<Result<Trip[], Error>> {
    const res = await fetch(`${API_BASE}/trips?userId=${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return err(new Error(`Error al obtener viajes: ${res.status}`));
    return ok(await res.json());
  }
}
