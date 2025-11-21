import { Injectable } from '@nestjs/common';
import { Result, ok, err } from 'neverthrow';
import { NotificationApiClient, NotificationDto } from '@going-monorepo-clean/notification-api-client'; // <--- NUEVA DEPENDENCIA
import { IAuthRepository } from '@going-monorepo-clean/domains-user-frontend-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

// --- View Model (Nuevo Modelo Simple para la UI) ---
export interface NotificationViewModel {
    id: UUID;
    title: string;
    body: string;
    isRead: boolean;
    timeAgo: string; // Para la UI
}

@Injectable()
export class GetUserNotificationsUseCase {
    private readonly apiClient: NotificationApiClient;
    private readonly authRepository: IAuthRepository;

    constructor(authRepository: IAuthRepository /* La inyección real de tu provider */) {
        this.apiClient = new NotificationApiClient(); 
        this.authRepository = authRepository;
    }

    async execute(userId: UUID): Promise<Result<NotificationViewModel[], Error>> {
        const sessionResult = await this.authRepository.loadSession();
        if (sessionResult.isErr() || !sessionResult.value) {
            return err(new Error('No estás autenticado.'));
        }
        const token = sessionResult.value.token;
        
        // 1. Llamar al Adaptador (API Client)
        const result = await this.apiClient.getByUserId(userId, token);

        if (result.isErr()) {
            return err(result.error);
        }
        
        // 2. Mapear DTOs simples a View Models (Transformación)
        const viewModels: NotificationViewModel[] = result.value.map(dto => ({
            id: dto.id,
            title: dto.title,
            body: dto.body,
            isRead: dto.status === 'READ',
            timeAgo: 'Justo ahora', // Aquí iría la lógica real de date-fns
        }));

        return ok(viewModels);
    }
}