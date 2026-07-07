'use client';

/**
 * ActiveRideBanner — banner flotante app-wide que aparece cuando la persona
 * tiene un viaje EN CURSO (conductora o conductor ya asignado y en camino).
 *
 * Es el punto de entrada elegido (Rubén 6-jul) a la vista en vivo del día del
 * viaje: en el modelo PROGRAMADO reservas antes y el viaje ocurre después, así
 * que al abrir la app el banner te lleva a "seguir tu viaje en vivo" (mapa,
 * llegada del conductor, verificación, SOS, fin, calificación).
 *
 * Reusa el endpoint GET /rides/mine/active (transport-service). Solo se muestra
 * cuando el estado indica conductor asignado/en camino/en curso.
 */
import { useEffect, useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { authFetch, getStoredToken } from '@/lib/providers/auth-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

// Estados con conductor asignado / viaje en curso → hay algo "en vivo" que seguir.
const LIVE_STATUSES = new Set(['accepted', 'arriving', 'started']);

interface ActiveRide {
  rideId: string;
  status: string;
  statusText?: string;
  eta?: { text?: string | null } | null;
}

export function ActiveRideBanner() {
  const router = useRouter();
  const pathname = usePathname();
  const [ride, setRide] = useState<ActiveRide | null>(null);

  const check = useCallback(async () => {
    if (!getStoredToken()) {
      setRide(null);
      return;
    }
    try {
      const res = await authFetch(`${API_URL}/rides/mine/active`, { method: 'GET' });
      if (!res.ok) return;
      const d = await res.json();
      if (d?.hasActive && d.ride && LIVE_STATUSES.has(d.ride.status)) setRide(d.ride);
      else setRide(null);
    } catch {
      /* offline / sin sesión → no molestar */
    }
  }, []);

  useEffect(() => {
    check();
    const t = setInterval(check, 30000); // re-chequeo periódico
    return () => clearInterval(t);
  }, [check]);

  // Ya estás en la vista en vivo → no dupliques el banner encima.
  if (!ride || pathname?.startsWith('/ride')) return null;

  const etaText = ride.eta?.text;

  return (
    <button
      type="button"
      onClick={() => router.push(`/ride?track=${ride.rideId}`)}
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl text-white active:scale-[0.98] transition-transform max-w-[92vw]"
      style={{ background: 'linear-gradient(135deg, #0033A0, #ff4c41)' }}
      aria-label="Seguir tu viaje en vivo"
    >
      <span className="text-xl flex-shrink-0">🚗</span>
      <div className="text-left min-w-0">
        <p className="text-sm font-black leading-tight">Tu viaje está en curso</p>
        <p className="text-xs opacity-90 truncate">
          {etaText ? `Tu conductora o conductor llega en ${etaText} · ` : ''}Toca para seguir en vivo
        </p>
      </div>
      <span className="ml-1 font-black flex-shrink-0">→</span>
    </button>
  );
}
