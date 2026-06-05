import { Result, ok, err } from 'neverthrow';
import type { IBookingRepository, Booking, CreateBookingRequest } from '@going-monorepo-clean/domains-booking-frontend-core';

const API_BASE = process.env['NX_API_URL'] || '/api';

export class HttpBookingRepository implements IBookingRepository {
  async create(data: CreateBookingRequest, token: string): Promise<Result<Booking, Error>> {
    const res = await fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    if (!res.ok) return err(new Error(`Error al crear reserva: ${res.status}`));
    return ok(await res.json());
  }

  async findById(bookingId: string, token: string): Promise<Result<Booking | null, Error>> {
    const res = await fetch(`${API_BASE}/bookings/${bookingId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return err(new Error(`Error al obtener reserva: ${res.status}`));
    return ok(await res.json());
  }

  async getByUser(userId: string, token: string): Promise<Result<Booking[], Error>> {
    const res = await fetch(`${API_BASE}/bookings?userId=${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return err(new Error(`Error al obtener reservas: ${res.status}`));
    return ok(await res.json());
  }

  async cancel(bookingId: string, token: string): Promise<Result<void, Error>> {
    const res = await fetch(`${API_BASE}/bookings/${bookingId}/cancel`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return err(new Error(`Error al cancelar reserva: ${res.status}`));
    return ok(undefined);
  }

  async confirm(bookingId: string, token: string): Promise<Result<Booking, Error>> {
    const res = await fetch(`${API_BASE}/bookings/${bookingId}/confirm`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return err(new Error(`Error al confirmar reserva: ${res.status}`));
    return ok(await res.json());
  }
}
