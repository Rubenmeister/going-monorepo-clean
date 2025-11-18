import { Result } from 'neverthrow';
import { Notification } from '../entities/notification.entity';
import { UUID } from '@going-monorepo-clean/shared-domain';

export const INotificationRepository = Symbol('INotificationRepository');

export interface INotificationRepository {
  /**
   * Obtiene la lista de notificaciones para un usuario.
   */
  getByUserId(userId: UUID, token: string): Promise<Result<Notification[], Error>>;
  
  /**
   * Marca una notificación específica como leída.
   */
  markAsRead(notificationId: UUID, token: string): Promise<Result<void, Error>>;
}