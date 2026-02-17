import { Result, ok, err } from 'neverthrow';
import { UUID } from '@going-monorepo-clean/shared-domain';

// --- Chat DTOs ---
export interface ChatMessageDto {
    id: UUID;
    tripId: UUID;
    senderId: UUID;
    senderRole: 'user' | 'driver' | 'admin';
    recipientId: UUID;
    content: string;
    status: 'SENT' | 'DELIVERED' | 'READ';
    createdAt: Date;
    readAt?: Date;
}

export interface SendChatMessageData {
    tripId: UUID;
    senderId: UUID;
    senderRole: 'user' | 'driver' | 'admin';
    recipientId: UUID;
    content: string;
}

const API_GATEWAY_URL = process.env['NEXT_PUBLIC_API_GATEWAY_URL'] || 'http://localhost:3000';

/**
 * Cliente HTTP para el dominio Chat (vive en notifications-service).
 */
export class ChatApiClient {
    private readonly baseUrl: string;

    constructor(baseUrl?: string) {
        this.baseUrl = baseUrl || `${API_GATEWAY_URL}/api/chat`;
    }

    public async sendMessage(data: SendChatMessageData, token: string): Promise<Result<ChatMessageDto, Error>> {
        try {
            const response = await fetch(`${this.baseUrl}/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                const errorData = await response.json();
                return err(new Error(errorData.message || 'Error al enviar mensaje.'));
            }
            return ok(await response.json());
        } catch (error) {
            return err(new Error('Error de red al enviar mensaje.'));
        }
    }

    public async getTripChat(tripId: UUID, token: string, limit?: number): Promise<Result<ChatMessageDto[], Error>> {
        try {
            let url = `${this.baseUrl}/trip/${tripId}`;
            if (limit) url += `?limit=${limit}`;

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) {
                const errorData = await response.json();
                return err(new Error(errorData.message || 'Error al obtener mensajes.'));
            }
            return ok(await response.json());
        } catch (error) {
            return err(new Error('Error de red al obtener mensajes.'));
        }
    }

    public async markTripChatRead(tripId: UUID, recipientId: UUID, token: string): Promise<Result<void, Error>> {
        try {
            const response = await fetch(`${this.baseUrl}/trip/${tripId}/read/${recipientId}`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` },
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
