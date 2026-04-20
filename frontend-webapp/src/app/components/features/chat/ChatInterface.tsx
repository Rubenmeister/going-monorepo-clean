'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { useChatService } from '@/hooks/features/useChatService';
import { rideService } from '@/services/ride';
import type { ChatInterfaceProps } from '@/types';
import { QUICK_REPLIES } from '@/types';
import { ChatMessage } from './ChatMessage';

/**
 * Chat flotante + llamada VoIP (Agora) entre pasajero y conductor.
 *
 * Comunicación disponible:
 *   1. Chat de texto en tiempo real (Socket.io)
 *   2. Llamada de voz in-app via Agora RTC (si el backend lo habilita)
 *   3. Fallback: número proxy Twilio para llamada telefónica
 */

/* ── Agora SDK loader (CDN, no instalar paquete) ── */
let agoraSDK: any = null;
async function loadAgoraSDK(): Promise<any> {
  if (agoraSDK) return agoraSDK;
  if (typeof window === 'undefined') return null;
  if ((window as any).AgoraRTC) { agoraSDK = (window as any).AgoraRTC; return agoraSDK; }

  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://download.agora.io/sdk/release/AgoraRTC_N-4.18.2.js';
    s.onload  = () => { agoraSDK = (window as any).AgoraRTC; resolve(agoraSDK); };
    s.onerror = () => reject(new Error('Agora SDK no disponible'));
    document.head.appendChild(s);
  });
}

type CallState = 'idle' | 'connecting' | 'active' | 'ended' | 'fallback';

export function ChatInterface({
  rideId,
  driverName = 'Conductor',
  userId,
  userName,
}: ChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [open, setOpen]   = useState(false);
  const [unread, setUnread] = useState(0);

  /* ── Call state ── */
  const [callState, setCallState] = useState<CallState>('idle');
  const [muted,     setMuted]     = useState(false);
  const [callSecs,  setCallSecs]  = useState(0);
  const [proxyNum,  setProxyNum]  = useState<string | null>(null);
  const [callError, setCallError] = useState<string | null>(null);

  const agoraClientRef   = useRef<any>(null);
  const localTrackRef    = useRef<any>(null);
  const callTimerRef     = useRef<ReturnType<typeof setInterval> | null>(null);

  const { messages, sendMessage } = useChatService(rideId, userId, userName);

  /* ── Auto-scroll ── */
  useEffect(() => {
    if (open) { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); setUnread(0); }
  }, [messages, open]);

  useEffect(() => {
    if (!open && messages.length > 0) {
      const last = messages[messages.length - 1];
      if (last.senderId !== userId) setUnread(n => n + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  /* ── Cleanup on unmount ── */
  useEffect(() => {
    return () => {
      endCall();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Start VoIP call ── */
  const startCall = useCallback(async () => {
    setCallError(null);
    setCallState('connecting');

    try {
      const { token, channel, enabled } = await rideService.getCallToken(rideId);

      if (!enabled || !token) {
        // Agora not configured — fall back to Twilio proxy number
        const proxy = await rideService.getProxyNumber(rideId).catch(() => null);
        setProxyNum(proxy?.proxyNumber ?? null);
        setCallState('fallback');
        return;
      }

      const AgoraRTC = await loadAgoraSDK();
      if (!AgoraRTC) throw new Error('SDK no cargó');

      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      agoraClientRef.current = client;

      await client.join(
        process.env.NEXT_PUBLIC_AGORA_APP_ID || '',
        channel,
        token,
        userId,
      );

      const micTrack = await AgoraRTC.createMicrophoneAudioTrack();
      localTrackRef.current = micTrack;
      await client.publish([micTrack]);

      setCallState('active');
      setCallSecs(0);
      callTimerRef.current = setInterval(() => setCallSecs(s => s + 1), 1000);

    } catch (err) {
      setCallError(err instanceof Error ? err.message : 'No se pudo iniciar la llamada');
      setCallState('idle');
    }
  }, [rideId, userId]);

  /* ── End call ── */
  const endCall = useCallback(async () => {
    if (callTimerRef.current) { clearInterval(callTimerRef.current); callTimerRef.current = null; }
    if (localTrackRef.current) { localTrackRef.current.stop(); localTrackRef.current.close(); localTrackRef.current = null; }
    if (agoraClientRef.current) { await agoraClientRef.current.leave().catch(() => {}); agoraClientRef.current = null; }
    setCallState('idle');
    setCallSecs(0);
    setMuted(false);
  }, []);

  /* ── Toggle mute ── */
  const toggleMute = useCallback(async () => {
    if (!localTrackRef.current) return;
    const next = !muted;
    await localTrackRef.current.setEnabled(!next);
    setMuted(next);
  }, [muted]);

  const callDuration = `${String(Math.floor(callSecs / 60)).padStart(2, '0')}:${String(callSecs % 60).padStart(2, '0')}`;

  return (
    <div className="fixed bottom-6 right-6 z-50">

      {/* ── Overlay de llamada activa ── */}
      {(callState === 'active' || callState === 'connecting' || callState === 'fallback') && (
        <div className="absolute bottom-16 right-0 w-72 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">

          {/* Call header */}
          <div className="px-4 py-3 flex items-center gap-3" style={{ backgroundColor: '#011627' }}>
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-lg font-black text-white">
              {driverName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="text-white font-bold text-sm">{driverName}</p>
              <p className="text-white/60 text-xs">
                {callState === 'connecting' ? 'Conectando…'
                  : callState === 'active'  ? callDuration
                  : 'Llamada telefónica'}
              </p>
            </div>
            {callState === 'active' && (
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-green-400 font-medium">En vivo</span>
              </div>
            )}
          </div>

          {callState === 'fallback' ? (
            <div className="p-4 text-center space-y-3">
              <p className="text-xs text-gray-500">Llamada VoIP no disponible. Usa el número del conductor:</p>
              {proxyNum ? (
                <a href={`tel:${proxyNum}`}
                  className="block w-full py-3 rounded-xl font-black text-lg tracking-widest text-white transition-all hover:opacity-90"
                  style={{ backgroundColor: '#ff4c41' }}>
                  📞 {proxyNum}
                </a>
              ) : (
                <p className="text-sm text-gray-400">Número no disponible aún</p>
              )}
              <button onClick={() => setCallState('idle')} className="text-xs text-gray-400 hover:text-gray-600 underline">
                Cerrar
              </button>
            </div>
          ) : (
            <div className="p-5 flex justify-center gap-6">
              <button onClick={toggleMute} disabled={callState !== 'active'} className="flex flex-col items-center gap-1 disabled:opacity-40">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-colors ${muted ? 'bg-red-100' : 'bg-gray-100'}`}>
                  {muted ? '🔇' : '🎙️'}
                </div>
                <span className="text-xs text-gray-500">{muted ? 'Sin micro' : 'Micro'}</span>
              </button>
              <button className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-xl">🔊</div>
                <span className="text-xs text-gray-500">Altavoz</span>
              </button>
              <button onClick={endCall} className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-xl transition-colors">📵</div>
                <span className="text-xs text-gray-500">Colgar</span>
              </button>
            </div>
          )}
        </div>
      )}

      {open && callState === 'idle' && (
        <div className="absolute bottom-16 right-0 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col" style={{ maxHeight: '420px' }}>
          <div className="bg-[#ff4c41] text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm font-black">{driverName.charAt(0).toUpperCase()}</div>
              <div>
                <p className="font-bold text-sm">{driverName}</p>
                <p className="text-xs text-red-100">Tu conductor</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={startCall} className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors" title="Llamar al conductor">
                <span className="text-base">📞</span>
              </button>
              <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white text-lg font-bold leading-none">✕</button>
            </div>
          </div>

          {callError && (
            <div className="px-3 pt-2">
              <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2 text-xs text-red-600">{callError}</div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50" style={{ minHeight: 160, maxHeight: 240 }}>
            {messages.length === 0 && <p className="text-center text-xs text-gray-400 mt-6">Di hola a tu conductor 👋</p>}
            {messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)}
            <div ref={messagesEndRef} />
          </div>

          <div className="px-3 py-2 flex gap-2 overflow-x-auto bg-white border-t border-gray-100">
            {QUICK_REPLIES.map((reply) => (
              <button key={reply} onClick={() => sendMessage(reply)} className="flex-shrink-0 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-full transition-colors whitespace-nowrap">{reply}</button>
            ))}
          </div>
          <ChatInputBar onSendMessage={sendMessage} />
        </div>
      )}

      {callState === 'idle' ? (
        <button onClick={() => { setOpen(o => !o); setUnread(0); setCallError(null); }}
          className="relative w-14 h-14 bg-[#ff4c41] hover:bg-[#e63a2f] text-white rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
          aria-label="Chat con conductor">
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
      ) : (
        <button onClick={() => setOpen(false)}
          className="relative w-14 h-14 text-white rounded-full shadow-xl flex items-center justify-center animate-pulse"
          style={{ backgroundColor: '#10b981' }}>
          <span className="text-2xl">📞</span>
        </button>
      )}
    </div>
  );
}

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
      <input ref={inputRef} type="text"
        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
        placeholder="Escribe un mensaje…"
        className="flex-1 text-sm border border-gray-200 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#ff4c41]" />
      <button onClick={handleSubmit}
        className="w-9 h-9 bg-[#ff4c41] text-white rounded-full flex items-center justify-center transition-colors hover:bg-[#e63a2f] flex-shrink-0">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      </button>
    </div>
  );
}
