/**
 * Hook for chat service operations
 */

import { useState, useEffect, useCallback } from 'react';
import { chatService } from '@/services/chat';
import type { ChatMessage } from '@/types';

export interface UseChatServiceReturn {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  sendMessage: (text: string) => void;
  clearMessages: () => void;
}

/**
 * Hook for managing chat operations
 */
export function useChatService(
  rideId: string,
  userId: string,
  userName: string
): UseChatServiceReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to incoming messages
  useEffect(() => {
    const unsubscribe = chatService.subscribeToMessages(
      rideId,
      userId,
      (message) => {
        setMessages((prev) => [...prev, message]);
      }
    );

    return () => unsubscribe();
  }, [rideId, userId]);

  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim()) {
        return;
      }

      // Add message to local state
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        senderId: userId,
        senderName: userName,
        text,
        timestamp: new Date(),
        isOwn: true,
      };

      setMessages((prev) => [...prev, newMessage]);

      // Send via WebSocket
      const sent = chatService.sendMessage({
        rideId,
        senderId: userId,
        senderName: userName,
        text,
      });

      if (!sent) {
        setError('Failed to send message - WebSocket not connected');
      }
    },
    [rideId, userId, userName]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    loading,
    error,
    sendMessage,
    clearMessages,
  };
}
