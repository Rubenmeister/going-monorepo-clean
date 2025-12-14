import { Notification } from '../entities/notification.entity';
import { Result } from 'neverthrow';

export const I_NOTIFICATION_REPOSITORY = Symbol('INotificationRepository');

export interface INotificationRepository {
  save(notification: Notification): Promise<Result<void, Error>>;
  findById(id: string): Promise<Result<Notification | null, Error>>;
  findByUserId(userId: string): Promise<Result<Notification[], Error>>;
  update(notification: Notification): Promise<Result<void, Error>>;
  getUnreadCount(userId: string): Promise<Result<number, Error>>;
  markAllAsRead(userId: string): Promise<Result<void, Error>>;
}