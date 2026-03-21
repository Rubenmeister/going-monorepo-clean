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
   */
  async getChatHistory(rideId: string): Promise<ChatMessage[]> {
    const API_BASE = typeof window !== 'undefined'
      ? (process.env.NEXT_PUBLIC_API_URL || 'https://api.goingec.com/api')
      : 'https://api.goingec.com/api';

    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

    try {
      const res = await fetch(`${API_BASE}/chat/rides/${rideId}/messages`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (!res.ok) return [];

      const data = await res.json();
      return (data.messages || []).map((m: any) => ({
        id: m.id || String(Date.now()),
        senderId: m.senderId,
        senderName: m.senderName,
        text: m.text || m.content,
        timestamp: new Date(m.timestamp || m.createdAt),
        isOwn: m.isOwn ?? false,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Mark messages as read
   */
  async markAsRead(rideId: string): Promise<void> {
    const API_BASE = typeof window !== 'undefined'
      ? (process.env.NEXT_PUBLIC_API_URL || 'https://api.goingec.com/api')
      : 'https://api.goingec.com/api';

    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

    try {
      await fetch(`${API_BASE}/chat/rides/${rideId}/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
    } catch {
      // Non-fatal error
    }
  }
}

export const chatService = new ChatService();
