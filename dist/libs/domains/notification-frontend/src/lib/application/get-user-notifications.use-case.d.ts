import { Result } from 'neverthrow';
import { IAuthRepository } from '@going-monorepo-clean/domains-user-frontend-core';
import { UUID } from '@going-monorepo-clean/shared-domain';
export interface NotificationViewModel {
    id: UUID;
    title: string;
    body: string;
    isRead: boolean;
    timeAgo: string;
}
export declare class GetUserNotificationsUseCase {
    private readonly apiClient;
    private readonly authRepository;
    constructor(authRepository: IAuthRepository);
    execute(userId: UUID): Promise<Result<NotificationViewModel[], Error>>;
}
