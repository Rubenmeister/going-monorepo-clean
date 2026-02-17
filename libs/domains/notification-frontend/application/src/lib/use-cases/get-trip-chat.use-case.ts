import { Result } from 'neverthrow';
import { ChatApiClient, ChatMessageDto } from '@going-monorepo-clean/notification-api-client';
import { ChatMessageViewModel } from './send-chat-message.use-case';

export class GetTripChatUseCase {
    private readonly apiClient: ChatApiClient;

    constructor() {
        this.apiClient = new ChatApiClient();
    }

    async execute(tripId: string, currentUserId: string, token: string): Promise<Result<ChatMessageViewModel[], Error>> {
        const result = await this.apiClient.getTripChat(tripId, token);

        return result.map((messages: ChatMessageDto[]) =>
            messages.map((msg) => ({
                id: msg.id,
                senderId: msg.senderId,
                senderRole: msg.senderRole,
                content: msg.content,
                isOwn: msg.senderId === currentUserId,
                time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isRead: msg.status === 'READ',
            })),
        );
    }
}
