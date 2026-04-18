'use client';

import { useEffect, useRef } from 'react';
import type { LiveEvent, SocketStatus } from '../../lib/useAdminSocket';

interface Props {
  events: LiveEvent[];
  status: SocketStatus;
  maxVisible?: number;
}

const EVENT_STYLES: Record<LiveEvent['type'], { icon: string; color: string; bg: string }> = {
  ride_accepted:   { icon: '✅', color: 'text-green-700',  bg: 'bg-green-50'  },
  ride_started:    { icon: '🚗', color: 'text-blue-700',   bg: 'bg-blue-50'   },
  ride_completed:  { icon: '🏁', color: 'text-gray-700',   bg: 'bg-gray-50'   },
  ride_cancelled:  { icon: '❌', color: 'text-red-700',    bg: 'bg-red-50'    },
  driver_online:   { icon: '🟢', color: 'text-green-700',  bg: 'bg-green-50'  },
  driver_offline:  { icon: '⭕', color: 'text-gray-500',   bg: 'bg-gray-50'   },
  location_update: { icon: '📍', color: 'text-indigo-700', bg: 'bg-indigo-50' },
};

const STATUS_DOT: Record<SocketStatus, { color: string; label: string }> = {
  connected:    { color: 'bg-green-400',  label: 'En vivo'       },
  connecting:   { color: 'bg-yellow-400 animate-pulse', label: 'Conectando…' },
  disconnected: { color: 'bg-gray-300',   label: 'Desconectado'  },
  error:        { color: 'bg-red-400',    label: 'Error'         },
};

function timeAgo(d: Date): string {
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 5)  return 'ahora';
  if (s < 60) return `hace ${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `hace ${m}m`;
  return `hace ${Math.floor(m / 60)}h`;
}

export function LiveOperationsFeed({ events, status, maxVisible = 50 }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const dot = STATUS_DOT[status];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events.length]);

  const visible = events.slice(-maxVisible);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col" style={{ minHeight: 320, maxHeight: 420 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-gray-800">Operaciones en vivo</span>
          <span className={`w-2 h-2 rounded-full ${dot.color}`} />
          <span className="text-xs text-gray-400">{dot.label}</span>
        </div>
        <span className="text-xs text-gray-400">{events.length} evento{events.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-400">
            <span className="text-3xl mb-2">📡</span>
            <p className="text-xs">
              {status === 'connected'
                ? 'Esperando eventos…'
                : status === 'connecting'
                ? 'Conectando al servidor…'
                : 'Sin conexión — reconectando'}
            </p>
          </div>
        ) : (
          visible.map(evt => {
            const style = EVENT_STYLES[evt.type] ?? EVENT_STYLES.location_update;
            return (
              <div key={evt.id}
                className={`flex items-start gap-2 rounded-xl px-3 py-2 ${style.bg}`}>
                <span className="text-base leading-none mt-0.5">{style.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold ${style.color} leading-tight`}>{evt.message}</p>
                  {evt.rideId && (
                    <p className="text-xs text-gray-400 font-mono mt-0.5">{evt.rideId.slice(0, 16)}…</p>
                  )}
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0 mt-0.5">{timeAgo(evt.timestamp)}</span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
