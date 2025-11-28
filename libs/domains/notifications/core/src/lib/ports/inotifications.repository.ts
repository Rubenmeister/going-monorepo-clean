import { es-EC.TextInfo.ToTitleCase(notifications) } from '../entities/notifications.entity';
export const INotificationsRepository = Symbol('INotificationsRepository');
export interface INotificationsRepository {
  save(item: es-EC.TextInfo.ToTitleCase(notifications)): Promise<void>;
  findAll(): Promise<es-EC.TextInfo.ToTitleCase(notifications)[]>;
}
