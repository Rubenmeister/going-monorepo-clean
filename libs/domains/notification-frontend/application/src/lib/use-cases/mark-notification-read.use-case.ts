import { Result } from 'neverthrow';
import { NotificationApiClient } from '@going-monorepo-clean/notification-api-client';

export class MarkNotificationReadUseCase {
    private readonly apiClient: NotificationApiClient;

    constructor() {
        this.apiClient = new NotificationApiClient();
    }

    async execute(notificationId: string, token: string): Promise<Result<void, Error>> {
        return this.apiClient.markAsRead(notificationId, token);
    }
}
