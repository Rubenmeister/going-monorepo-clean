import { Result, ok, err } from 'neverthrow';
import type { IParcelRepository, Parcel, CreateParcelRequest } from '@going-monorepo-clean/domains-parcel-frontend-core';

const API_BASE = process.env['NX_API_URL'] || '/api';

export class HttpParcelRepository implements IParcelRepository {
  async create(data: CreateParcelRequest, token: string): Promise<Result<Parcel, Error>> {
    const res = await fetch(`${API_BASE}/parcels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    if (!res.ok) return err(new Error(`Error al crear encomienda: ${res.status}`));
    return ok(await res.json());
  }

  async findByUserId(userId: string, token: string): Promise<Result<Parcel[], Error>> {
    const res = await fetch(`${API_BASE}/parcels?userId=${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return err(new Error(`Error al obtener encomiendas: ${res.status}`));
    return ok(await res.json());
  }

  async findByTrackingCode(code: string, token: string): Promise<Result<Parcel | null, Error>> {
    const res = await fetch(`${API_BASE}/parcels/track/${code}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return err(new Error(`Error al rastrear encomienda: ${res.status}`));
    return ok(await res.json());
  }
}
