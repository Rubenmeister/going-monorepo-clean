import { Result } from 'neverthrow';
import { Notification } from '../entities/notification.entity';
import { NotificationChannel } from '../value-objects/NotificationChannel.vo';
import { UUID } from '@going-monorepo-clean/shared-domain';

export const INotificationRepository = Symbol('INotificationRepository');

export interface INotificationRepository {
  save(notification: Notification): Promise<Result<void, Error>>;
  update(notification: Notification): Promise<Result<void, Error>>;
  findById(id: UUID): Promise<Result<Notification | null, Error>>;
  findPendingByChannel(channel: NotificationChannel): Promise<Result<Notification[], Error>>;
  findByUserId(userId: UUID, limit: number): Promise<Result<Notification[], Error>>;
}