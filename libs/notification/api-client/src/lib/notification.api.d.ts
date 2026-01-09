import { Result } from 'neverthrow';
import { UUID } from '@going-monorepo-clean/shared-domain';
export interface NotificationDto {
    id: UUID;
    userId: UUID;
    title: string;
    body: string;
    status: 'PENDING' | 'SENT' | 'FAILED' | 'READ';
    createdAt: Date;
    readAt?: Date;
}
/**
 * Cliente HTTP puro para el dominio Notification.
 */
export declare class NotificationApiClient {
    private readonly baseUrl;
    getByUserId(userId: UUID, token: string): Promise<Result<NotificationDto[], Error>>;
    markAsRead(notificationId: UUID, token: string): Promise<Result<void, Error>>;
}
