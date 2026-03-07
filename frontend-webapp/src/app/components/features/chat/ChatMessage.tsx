/**
 * Individual chat message component
 */

import type { ChatMessage as ChatMessageType } from '@/types';

interface ChatMessageProps {
  message: ChatMessageType;
}

/**
 * Displays a single chat message
 */
export function ChatMessage({ message }: ChatMessageProps) {
  const isSystemMessage = message.senderId === 'system';

  return (
    <div className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
          message.isOwn
            ? 'bg-[#ff4c41] text-white rounded-br-sm'
            : isSystemMessage
            ? 'bg-gray-100 text-gray-500 text-xs text-center mx-auto'
            : 'bg-gray-100 text-gray-800 rounded-bl-sm'
        }`}
      >
        <p>{message.text}</p>
        {!isSystemMessage && (
          <p
            className={`text-xs mt-0.5 ${
              message.isOwn ? 'text-red-200' : 'text-gray-400'
            }`}
          >
            {message.timestamp.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        )}
      </div>
    </div>
  );
}
