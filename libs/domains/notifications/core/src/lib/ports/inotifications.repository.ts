import { Notification } from '../entities/notification.entity';

export const I_NOTIFICATION_REPOSITORY = Symbol('INotificationRepository');

export interface INotificationRepository {
    /**
     * Guarda el historial de una notificación (independientemente del éxito o fracaso).
     */
    save(notification: Notification): Promise<Notification>;

    // [Otros métodos de búsqueda si son necesarios]
}