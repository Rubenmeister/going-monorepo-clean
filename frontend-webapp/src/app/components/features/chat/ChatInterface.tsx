'use client';

import { useRef, useEffect, useState } from 'react';
import { useChatService } from '@/hooks/features/useChatService';
import type { ChatInterfaceProps } from '@/types';
import { QUICK_REPLIES } from '@/types';
import { ChatMessage } from './ChatMessage';

/**
 * Chat flotante entre pasajero y conductor durante el viaje.
 * Botón rojo fijo abajo-derecha. Clic abre/cierra el panel.
 */
export function ChatInterface({
  rideId,
  driverName = 'Conductor',
  userId,
  userName,
}: ChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  const { messages, sendMessage } = useChatService(rideId, userId, userName);

  // Auto-scroll al último mensaje cuando el panel está abierto
  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setUnread(0);
    }
  }, [messages, open]);

  // Incrementar badge cuando llegan mensajes y el panel está cerrado
  useEffect(() => {
    if (!open && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.senderId !== userId) setUnread(n => n + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* ── Panel de mensajes ── */}
      {open && (
        <div className="absolute bottom-16 right-0 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col"
          style={{ maxHeight: '420px' }}>

          {/* Header */}
          <div className="bg-[#ff4c41] text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm font-black">
                {driverName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-sm">{driverName}</p>
                <p className="text-xs text-red-100">Tu conductor</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white text-lg font-bold leading-none">✕</button>
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50" style={{ minHeight: 160, maxHeight: 240 }}>
            {messages.length === 0 && (
              <p className="text-center text-xs text-gray-400 mt-6">
                Di hola a tu conductor 👋
              </p>
            )}
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Respuestas rápidas */}
          <div className="px-3 py-2 flex gap-2 overflow-x-auto bg-white border-t border-gray-100">
            {QUICK_REPLIES.map((reply) => (
              <button
                key={reply}
                onClick={() => sendMessage(reply)}
                className="flex-shrink-0 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-full transition-colors whitespace-nowrap"
              >
                {reply}
              </button>
            ))}
          </div>

          {/* Input */}
          <ChatInputBar onSendMessage={sendMessage} />
        </div>
      )}

      {/* ── Botón toggle ── */}
      <button
        onClick={() => { setOpen(o => !o); setUnread(0); }}
        className="relative w-14 h-14 bg-[#ff4c41] hover:bg-[#e63a2f] text-white rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        aria-label="Chat con conductor"
      >
        {open ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-white text-[#ff4c41] text-xs w-5 h-5 rounded-full flex items-center justify-center font-black shadow">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
    </div>
  );
}

/**
 * Input de mensaje
 */
function ChatInputBar({ onSendMessage }: { onSendMessage: (msg: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    const text = inputRef.current?.value.trim();
    if (!text) return;
    onSendMessage(text);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="p-3 border-t border-gray-100 flex gap-2 bg-white">
      <input
        ref={inputRef}
        type="text"
        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
        placeholder="Escribe un mensaje…"
        className="flex-1 text-sm border border-gray-200 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#ff4c41]"
      />
      <button
        onClick={handleSubmit}
        className="w-9 h-9 bg-[#ff4c41] text-white rounded-full flex items-center justify-center transition-colors hover:bg-[#e63a2f] flex-shrink-0"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      </button>
    </div>
  );
}
