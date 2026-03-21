'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDriver } from '../store';
import AppShell from '../components/AppShell';

type TripStatus = 'going_to_origin' | 'waiting' | 'in_progress' | 'completed';

const TRIP = {
  passenger: 'Ana Martínez',
  phone: '+593 99 456 7890',
  origin: 'Av. Amazonas N21-147, Quito',
  destination: 'Aeropuerto Mariscal Sucre, Tababela',
  distance: '18 km',
  fare: '$12.50',
};

const STATUS_CONFIG: Record<
  TripStatus,
  { label: string; btn: string; next: TripStatus | null; color: string }
> = {
  going_to_origin: {
    label: 'En camino al pasajero',
    btn: 'Llegué al origen',
    next: 'waiting',
    color: '#f59e0b',
  },
  waiting: {
    label: 'Esperando al pasajero',
    btn: 'Iniciar viaje',
    next: 'in_progress',
    color: '#0ea5e9',
  },
  in_progress: {
    label: 'Viaje en progreso',
    btn: 'Finalizar viaje',
    next: 'completed',
    color: '#22c55e',
  },
  completed: {
    label: 'Viaje completado ✓',
    btn: 'Volver al dashboard',
    next: null,
    color: '#6b7280',
  },
};

export default function TripPage() {
  const { token, isReady, init } = useDriver();
  const router = useRouter();
  const [status, setStatus] = useState<TripStatus>('going_to_origin');
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    init();
  }, [init]);
  useEffect(() => {
    if (isReady && !token) router.replace('/login');
  }, [isReady, token, router]);

  useEffect(() => {
    if (status !== 'in_progress') return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [status]);

  const cfg = STATUS_CONFIG[status];
  const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const secs = String(elapsed % 60).padStart(2, '0');

  const advance = () => {
    if (cfg.next) {
      setStatus(cfg.next);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <AppShell title="Viaje activo">
      <div className="p-4">
        {/* Status banner */}
        <div
          className="rounded-2xl p-4 mb-4 flex items-center gap-3"
          style={{ backgroundColor: `${cfg.color}18` }}
        >
          <div
            className="w-3 h-3 rounded-full flex-shrink-0 animate-pulse"
            style={{ backgroundColor: cfg.color }}
          />
          <p className="font-bold text-sm" style={{ color: cfg.color }}>
            {cfg.label}
          </p>
          {status === 'in_progress' && (
            <span
              className="ml-auto font-mono text-sm font-bold"
              style={{ color: cfg.color }}
            >
              {mins}:{secs}
            </span>
          )}
        </div>

        {/* Passenger card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black text-white"
              style={{ backgroundColor: '#ff4c41' }}
            >
              {TRIP.passenger[0]}
            </div>
            <div>
              <p className="font-bold text-gray-900">{TRIP.passenger}</p>
              <p className="text-xs text-gray-400">{TRIP.phone}</p>
            </div>
            <a
              href={`tel:${TRIP.phone}`}
              className="ml-auto w-10 h-10 rounded-xl flex items-center justify-center text-white"
              style={{ backgroundColor: '#22c55e' }}
            >
              📞
            </a>
          </div>

          {/* Route */}
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="mt-0.5 text-sm">🟢</span>
              <div>
                <p className="text-xs text-gray-400">Origen</p>
                <p className="text-sm font-medium text-gray-900">
                  {TRIP.origin}
                </p>
              </div>
            </div>
            <div className="w-0.5 h-4 bg-gray-200 ml-3" />
            <div className="flex items-start gap-2">
              <span className="mt-0.5 text-sm">🔴</span>
              <div>
                <p className="text-xs text-gray-400">Destino</p>
                <p className="text-sm font-medium text-gray-900">
                  {TRIP.destination}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-3 mt-3 border-t border-gray-50">
            <div>
              <p className="text-xs text-gray-400">Distancia</p>
              <p className="text-sm font-bold text-gray-900">{TRIP.distance}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Tarifa</p>
              <p className="text-sm font-bold" style={{ color: '#22c55e' }}>
                {TRIP.fare}
              </p>
            </div>
          </div>
        </div>

        {/* Map placeholder */}
        <div
          className="rounded-2xl h-40 mb-4 flex items-center justify-center"
          style={{ backgroundColor: '#f1f5f9' }}
        >
          <div className="text-center">
            <span className="text-3xl">🗺️</span>
            <p className="text-xs text-gray-400 mt-1">Mapa en tiempo real</p>
          </div>
        </div>

        {/* Action button */}
        <button
          onClick={advance}
          className="w-full py-4 rounded-2xl font-bold text-white text-base transition-opacity"
          style={{ backgroundColor: cfg.color }}
        >
          {cfg.btn}
        </button>
      </div>
    </AppShell>
  );
}
