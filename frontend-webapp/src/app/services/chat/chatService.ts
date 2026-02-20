/**
 * Chat service - handles chat operations and messaging
 */

import type { ChatMessage, WebSocketChatMessage } from '@/types';
import { wsService } from '../websocket';

export interface SendMessageRequest {
  rideId: string;
  senderId: string;
  senderName: string;
  text: string;
}

class ChatService {
  /**
   * Send a chat message
   */
  sendMessage(request: SendMessageRequest): boolean {
    return wsService.send('chat:message', {
      rideId: request.rideId,
      senderId: request.senderId,
      senderName: request.senderName,
      text: request.text,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Subscribe to chat messages for a ride
   */
  subscribeToMessages(
    rideId: string,
    userId: string,
    onMessageReceived: (message: ChatMessage) => void
  ): () => void {
    return wsService.on(`chat:message:${rideId}`, (data) => {
      const wsMessage = data as WebSocketChatMessage;

      // Skip own messages
      if (wsMessage.senderId === userId) {
        return;
      }

      const message: ChatMessage = {
        id: Date.now().toString(),
        senderId: wsMessage.senderId,
        senderName: wsMessage.senderName,
        text: wsMessage.text,
        timestamp: new Date(wsMessage.timestamp),
        isOwn: false,
      };

      onMessageReceived(message);
    });
  }

  /**
   * Get chat history for a ride
   * TODO: Implement API call to fetch history
   */
  async getChatHistory(rideId: string): Promise<ChatMessage[]> {
    // Placeholder for API call
    // const response = await apiClient.get(`/chats/${rideId}`);
    // return response.data;
    return [];
  }

  /**
   * Mark messages as read
   * TODO: Implement API call
   */
  async markAsRead(rideId: string): Promise<void> {
    // Placeholder for API call
    // await apiClient.post(`/chats/${rideId}/read`);
  }
}

export const chatService = new ChatService();
