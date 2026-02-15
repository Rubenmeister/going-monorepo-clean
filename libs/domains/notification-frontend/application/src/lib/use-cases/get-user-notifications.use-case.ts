import { Injectable } from '@nestjs/common';
import { Result, ok, err } from 'neverthrow';
import { NotificationApiClient } from '@going-monorepo-clean/notification-api-client';
import { UUID } from '@going-monorepo-clean/shared-domain';

export interface NotificationViewModel {
    id: UUID;
    title: string;
    body: string;
    isRead: boolean;
    timeAgo: string;
}

@Injectable()
export class GetUserNotificationsUseCase {
    private readonly apiClient: NotificationApiClient;

    constructor() {
        this.apiClient = new NotificationApiClient();
    }

    async execute(userId: UUID, token: string): Promise<Result<NotificationViewModel[], Error>> {
        const result = await this.apiClient.getByUserId(userId, token);

        if (result.isErr()) {
            return err(result.error);
        }

        const viewModels: NotificationViewModel[] = result.value.map(dto => ({
            id: dto.id,
            title: dto.title,
            body: dto.body,
            isRead: dto.status === 'READ',
            timeAgo: 'Justo ahora',
        }));

        return ok(viewModels);
    }
}
