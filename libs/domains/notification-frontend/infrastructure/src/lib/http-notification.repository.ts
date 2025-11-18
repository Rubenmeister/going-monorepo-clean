import { Result, ok, err } from 'neverthrow';
import {
  Notification,
  INotificationRepository,
} from '@going-monorepo-clean/domains-notification-frontend-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

const API_GATEWAY = 'http://localhost:3000/api';

export class HttpNotificationRepository implements INotificationRepository {
  
  async getByUserId(userId: UUID, token: string): Promise<Result<Notification[], Error>> {
    try {
      const response = await fetch(`${API_GATEWAY}/notifications/user/${userId}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.message || 'Error al obtener notificaciones');

      return ok(data.map((item: any) => Notification.fromPrimitives(item)));
    } catch (error) {
      return err(new Error(error.message || 'Error de red al obtener notificaciones'));
    }
  }

  async markAsRead(notificationId: UUID, token: string): Promise<Result<void, Error>> {
    try {
      const response = await fetch(`${API_GATEWAY}/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message);
      }
      return ok(undefined);
    } catch (error) {
      return err(new Error(error.message || 'Error de red al marcar como leído'));
    }
  }
}