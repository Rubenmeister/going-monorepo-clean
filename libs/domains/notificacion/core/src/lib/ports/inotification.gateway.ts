import { Result } from 'neverthrow';
import { Notification } from '../entities/notification.entity';

export const INotificationGateway = Symbol('INotificationGateway');

export interface INotificationGateway {
  send(notification: Notification): Promise<Result<void, Error>>;
}