import { Result } from 'neverthrow';
import { ChatApiClient, ChatMessageDto, SendChatMessageData } from '@going-monorepo-clean/notification-api-client';

export interface ChatMessageViewModel {
    id: string;
    senderId: string;
    senderRole: string;
    content: string;
    isOwn: boolean;
    time: string;
    isRead: boolean;
}

export class SendChatMessageUseCase {
    private readonly apiClient: ChatApiClient;

    constructor() {
        this.apiClient = new ChatApiClient();
    }

    async execute(data: SendChatMessageData, token: string): Promise<Result<ChatMessageViewModel, Error>> {
        const result = await this.apiClient.sendMessage(data, token);

        return result.map((dto: ChatMessageDto) => ({
            id: dto.id,
            senderId: dto.senderId,
            senderRole: dto.senderRole,
            content: dto.content,
            isOwn: true,
            time: new Date(dto.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isRead: dto.status === 'READ',
        }));
    }
}
