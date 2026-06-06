import { Result } from 'neverthrow';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  status: 'UNREAD' | 'READ';
  createdAt: Date;
}

export const INotificationRepository = Symbol('INotificationRepository');

export interface INotificationRepository {
  getByUserId(userId: string, token: string, limit?: number): Promise<Result<Notification[], Error>>;
  markAsRead(notificationId: string, token: string): Promise<Result<void, Error>>;
}
