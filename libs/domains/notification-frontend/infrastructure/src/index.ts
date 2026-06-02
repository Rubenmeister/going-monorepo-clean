import { Result, ok, err } from 'neverthrow';
import type { INotificationRepository, Notification } from '@going-monorepo-clean/domains-notification-frontend-core';

const API_BASE = process.env['NX_API_URL'] || '/api';

export class HttpNotificationRepository implements INotificationRepository {
  async getByUserId(userId: string, token: string, limit?: number): Promise<Result<Notification[], Error>> {
    const params = new URLSearchParams({ userId });
    if (limit) params.set('limit', String(limit));
    const res = await fetch(`${API_BASE}/notifications?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return err(new Error(`Error al obtener notificaciones: ${res.status}`));
    return ok(await res.json());
  }

  async markAsRead(notificationId: string, token: string): Promise<Result<void, Error>> {
    const res = await fetch(`${API_BASE}/notifications/${notificationId}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return err(new Error(`Error al marcar como leída: ${res.status}`));
    return ok(undefined);
  }
}
