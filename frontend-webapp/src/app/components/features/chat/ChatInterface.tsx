'use client';

import { useRef, useEffect } from 'react';
import { useChatService } from '@/hooks/features/useChatService';
import type { ChatInterfaceProps } from '@/types';
import { QUICK_REPLIES } from '@/types';
import { ChatMessage } from './ChatMessage';

/**
 * Chat interface component for ride communication
 */
export function ChatInterface({
  rideId,
  driverName = 'Driver',
  userId,
  userName,
}: ChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage } = useChatService(rideId, userId, userName);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <ChatButton unreadCount={0} />

      <div className="absolute bottom-16 right-0 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col">
        {/* Header */}
        <ChatHeader driverName={driverName} />

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-72 min-h-48">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick replies */}
        <QuickRepliesBar onSelectReply={sendMessage} />

        {/* Input */}
        <ChatInputBar onSendMessage={sendMessage} />
      </div>
    </div>
  );
}

/**
 * Chat toggle button
 */
function ChatButton({ unreadCount }: { unreadCount: number }) {
  return (
    <button
      className="relative w-14 h-14 bg-[#ff4c41] hover:bg-[#e63a2f] text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
      aria-label="Open chat"
    >
      <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
}

/**
 * Chat header with driver info
 */
function ChatHeader({ driverName }: { driverName: string }) {
  return (
    <div className="bg-[#ff4c41] text-white p-4 flex items-center gap-3">
      <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center text-sm font-bold">
        {driverName.charAt(0)}
      </div>
      <div>
        <p className="font-semibold text-sm">{driverName}</p>
        <p className="text-xs text-red-200">Your driver</p>
      </div>
    </div>
  );
}

/**
 * Quick replies bar
 */
function QuickRepliesBar({
  onSelectReply,
}: {
  onSelectReply: (reply: string) => void;
}) {
  return (
    <div className="px-3 py-1 flex gap-2 overflow-x-auto">
      {QUICK_REPLIES.map((reply) => (
        <button
          key={reply}
          onClick={() => onSelectReply(reply)}
          className="flex-shrink-0 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1 rounded-full transition-colors"
        >
          {reply}
        </button>
      ))}
    </div>
  );
}

/**
 * Chat input bar
 */
function ChatInputBar({
  onSendMessage,
}: {
  onSendMessage: (message: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    const text = inputRef.current?.value.trim();
    if (!text) return;

    onSendMessage(text);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="p-3 border-t border-gray-100 flex gap-2">
      <input
        ref={inputRef}
        type="text"
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        className="flex-1 text-sm border border-gray-200 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
        data-testid="chat-input"
      />
      <button
        onClick={handleSubmit}
        className="w-9 h-9 bg-[#ff4c41] text-white rounded-full flex items-center justify-center transition-colors hover:bg-[#e63a2f]"
        aria-label="Send message"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
          />
        </svg>
      </button>
    </div>
  );
}
