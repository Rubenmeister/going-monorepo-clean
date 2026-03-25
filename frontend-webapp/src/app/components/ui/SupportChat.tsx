'use client';

import { useEffect, useRef, useState } from 'react';

/* ── tipos ─────────────────────────────────────────── */
interface Msg {
  role: 'user' | 'bot';
  text: string;
}

/* ── ID de sesión anónima persistente ──────────────── */
function getSessionId(): string {
  const key = 'going_support_uid';
  if (typeof window === 'undefined') return 'anon';
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = `web_${Math.random().toString(36).slice(2)}_${Date.now()}`;
    sessionStorage.setItem(key, id);
  }
  return id;
}

// Si hay URL directa al servicio → /chat/message
// Si solo hay API Gateway → /support/chat/message (el gateway hace proxy)
const SUPPORT_DIRECT = process.env.NEXT_PUBLIC_SUPPORT_SERVICE_URL || '';
const CHAT_ENDPOINT = SUPPORT_DIRECT
  ? `${SUPPORT_DIRECT}/chat/message`
  : `${process.env.NEXT_PUBLIC_API_URL || ''}/support/chat/message`;

export default function SupportChat() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: 'bot', text: '¡Hola! Soy el asistente de Going 👋 ¿En qué puedo ayudarte?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, open]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setMsgs(prev => [...prev, { role: 'user', text }]);
    setLoading(true);

    try {
      const res = await fetch(CHAT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: getSessionId(), message: text }),
      });
      const data = await res.json();
      setMsgs(prev => [...prev, { role: 'bot', text: data.reply || 'Lo siento, intenta de nuevo.' }]);
    } catch {
      setMsgs(prev => [...prev, { role: 'bot', text: 'Error de conexión. Intenta más tarde.' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* ── Botón flotante ── */}
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="Abrir chat de soporte"
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          width: 56, height: 56, borderRadius: '50%',
          backgroundColor: '#ff4c41', border: 'none',
          boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'transform 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
      >
        {open ? (
          /* X */
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          /* Burbuja de chat */
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        )}
      </button>

      {/* ── Ventana de chat ── */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 92, right: 24, zIndex: 9998,
          width: 340, maxHeight: 480,
          display: 'flex', flexDirection: 'column',
          borderRadius: 16, overflow: 'hidden',
          boxShadow: '0 8px 40px rgba(0,0,0,0.22)',
          fontFamily: 'sans-serif',
        }}>
          {/* Header */}
          <div style={{ backgroundColor: '#ff4c41', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🤖</div>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>Asistente Going</div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11 }}>Siempre disponible</div>
            </div>
          </div>

          {/* Mensajes */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '14px 14px 8px',
            backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: 10,
            maxHeight: 320,
          }}>
            {msgs.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '80%', padding: '8px 13px', borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  backgroundColor: m.role === 'user' ? '#ff4c41' : '#fff',
                  color: m.role === 'user' ? '#fff' : '#1f2937',
                  fontSize: 13, lineHeight: 1.45,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                }}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex' }}>
                <div style={{ backgroundColor: '#fff', borderRadius: '16px 16px 16px 4px', padding: '10px 14px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                  <span style={{ display: 'inline-block', animation: 'pulse 1s infinite' }}>●●●</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ backgroundColor: '#fff', padding: '10px 12px', display: 'flex', gap: 8, borderTop: '1px solid #e5e7eb' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Escribe tu mensaje..."
              style={{
                flex: 1, border: '1px solid #e5e7eb', borderRadius: 20,
                padding: '8px 14px', fontSize: 13, outline: 'none',
                backgroundColor: '#f9fafb',
              }}
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              style={{
                width: 38, height: 38, borderRadius: '50%', border: 'none',
                backgroundColor: input.trim() ? '#ff4c41' : '#e5e7eb',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: input.trim() ? 'pointer' : 'default', transition: 'background 0.2s',
                flexShrink: 0,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={input.trim() ? '#fff' : '#9ca3af'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
