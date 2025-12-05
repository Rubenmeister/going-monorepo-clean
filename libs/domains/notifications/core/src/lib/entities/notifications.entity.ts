import { UUID } from '@going-monorepo-clean/shared-domain';

export type DeliveryStatus = 'sent' | 'failed' | 'queued';
export type NotificationType = 'email' | 'sms' | 'push';

export interface NotificationProps {
    id: UUID;
    recipient: string;     // Email o número de teléfono
    type: NotificationType;
    subject: string;       // Asunto o título
    status: DeliveryStatus;
    relatedEntityId: UUID; // ID de Booking, User, etc.
    sentAt: Date;
    failureReason?: string;
}

export class Notification {
    // ... (Constructor y campos de readonly similares a las otras entidades) ...

    // Método estático para registrar un intento fallido
    public static createFailed(props: Omit<NotificationProps, 'status' | 'sentAt' | 'failureReason'>, reason: string): Notification {
        return new Notification({
            ...props,
            id: new UUID(),
            status: 'failed',
            sentAt: new Date(),
            failureReason: reason,
        });
    }

    // Método estático para registrar un envío exitoso
    public static createSent(props: Omit<NotificationProps, 'status' | 'sentAt' | 'failureReason'>): Notification {
        return new Notification({
            ...props,
            id: new UUID(),
            status: 'sent',
            sentAt: new Date(),
            failureReason: undefined,
        });
    }
}