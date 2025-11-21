import { Result, ok, err } from 'neverthrow';
import { UUID } from '@going-monorepo-clean/shared-domain';

// --- DTOs de Notificación que vienen del Backend ---
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
export class NotificationApiClient {
    private readonly baseUrl = 'http://localhost:3000/api/notifications';
    
    public async getByUserId(userId: UUID, token: string): Promise<Result<NotificationDto[], Error>> {
        try {
            const response = await fetch(`${this.baseUrl}/user/${userId}`, {
                method: 'GET',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                },
            });
            
            const data: NotificationDto[] = await response.json();
            
            if (!response.ok) {
                return err(new Error(data.message || 'Error al obtener notificaciones.'));
            }
            
            return ok(data);
        } catch (error) {
            return err(new Error('Error de red al conectar con el Gateway.'));
        }
    }

    public async markAsRead(notificationId: UUID, token: string): Promise<Result<void, Error>> {
        try {
            const response = await fetch(`${this.baseUrl}/${notificationId}/read`, {
                method: 'PATCH',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                },
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                return err(new Error(errorData.message || 'Error al marcar como leído.'));
            }
            
            return ok(undefined);
        } catch (error) {
            return err(new Error('Error de red.'));
        }
    }
}