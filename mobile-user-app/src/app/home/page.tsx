'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, authFetch } from '../store';
import AppShell from '../components/AppShell';

interface Ride {
  _id: string;
  status: string;
  origin?: { address: string };
  destination?: { address: string };
  fare?: number;
  createdAt?: string;
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending:     { label: 'Buscando conductor', color: '#f59e0b' },
  accepted:    { label: 'Conductor asignado', color: '#0033A0' },
  in_progress: { label: 'En curso',           color: '#16a34a' },
  completed:   { label: 'Completado',         color: '#6b7280' },
  cancelled:   { label: 'Cancelado',          color: '#ef4444' },
};

const QUICK_ACTIONS = [
  { icon: '💳', label: 'Wallet',      href: '/wallet',   color: '#0033A0' },
  { icon: '🕐', label: 'Historial',   href: '/bookings', color: '#0033A0' },
  { icon: '🆘', label: 'SOS',         href: '/sos',      color: '#ef4444' },
  { icon: '📦', label: 'Envíos',      href: '/search?tab=envios',       color: '#f59e0b' },
  { icon: '🏨', label: 'Alojamiento', href: '/search?tab=accommodation', color: '#8b5cf6' },
  { icon: '🗺️', label: 'Tours',       href: '/search?tab=tours',        color: '#10b981' },
];

export default function HomePage() {
  const { user, token, isReady, init } = useAuth();
  const router = useRouter();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loadingRides, setLoadingRides] = useState(true);

  useEffect(() => { init(); }, [init]);

  useEffect(() => {
    if (isReady && !token) router.replace('/login');
  }, [isReady, token, router]);

  useEffect(() => {
    if (!user || !token) return;
    authFetch(`/transport/user/${user.id}/history`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setRides(Array.isArray(data) ? data.slice(0, 5) : []))
      .catch(() => setRides([]))
      .finally(() => setLoadingRides(false));
  }, [user, token]);

  if (!isReady || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#011627' }}>
        <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: '#ff4c41', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <AppShell>
      <div className="p-4 space-y-5">

        {/* ── Saludo ── */}
        <div>
          <h1 className="text-xl font-black text-gray-900">
            Hola, {user.firstName} 👋
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">¿A dónde viajas hoy?</p>
        </div>

        {/* ── Card principal: Pedir un viaje ── */}
        <button
          onClick={() => router.push('/search')}
          className="w-full rounded-3xl overflow-hidden shadow-md active:scale-[0.99] transition-all text-left"
          style={{ background: 'linear-gradient(135deg, #FFCD00 0%, #FFE066 100%)' }}
        >
          <div className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[#0033A0] text-xs font-bold uppercase tracking-widest mb-1">Transporte</p>
              <h2 className="text-2xl font-black text-[#0033A0] leading-tight">Pedir un viaje</h2>
              <p className="text-[#0033A0]/70 text-xs mt-1.5">Rápido, seguro y rastreable</p>
              <div className="mt-3 inline-flex items-center gap-1 bg-[#0033A0] text-white text-xs font-bold px-3 py-1.5 rounded-xl">
                Buscar viaje →
              </div>
            </div>
            <div className="w-16 h-16 bg-[#0033A0] rounded-2xl flex items-center justify-center flex-shrink-0 ml-3">
              <span className="text-4xl">🚗</span>
            </div>
          </div>
        </button>

        {/* ── Acciones rápidas ── */}
        <div className="grid grid-cols-3 gap-3">
          {QUICK_ACTIONS.map(item => (
            <button
              key={item.label}
              onClick={() => router.push(item.href)}
              className="bg-white rounded-2xl p-3 border border-gray-100 active:scale-95 transition-all flex flex-col items-center gap-1.5 text-center shadow-sm"
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="text-xs font-semibold text-gray-600">{item.label}</span>
            </button>
          ))}
        </div>

        {/* ── Últimos viajes ── */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Últimos viajes</h3>
            <button onClick={() => router.push('/bookings')}
              className="text-xs font-semibold" style={{ color: '#0033A0' }}>
              Ver todos →
            </button>
          </div>

          {loadingRides ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: '#0033A0', borderTopColor: 'transparent' }} />
            </div>
          ) : rides.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
              <p className="text-3xl mb-1.5">🚕</p>
              <p className="text-gray-400 text-sm">Aún no tienes viajes.</p>
              <button onClick={() => router.push('/search')}
                className="mt-2 text-sm font-bold underline" style={{ color: '#0033A0' }}>
                Pedir viaje →
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {rides.map(ride => {
                const s = STATUS_LABEL[ride.status] ?? { label: ride.status, color: '#6b7280' };
                const date = ride.createdAt
                  ? new Date(ride.createdAt).toLocaleDateString('es-EC', { day: 'numeric', month: 'short' })
                  : '';
                return (
                  <div key={ride._id}
                    className="bg-white rounded-2xl border border-gray-100 p-3.5 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-lg flex-shrink-0">🚗</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {ride.destination?.address ?? 'Destino desconocido'}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {ride.origin?.address ?? ''}{date ? ` · ${date}` : ''}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-gray-900">
                        {ride.fare ? `$${ride.fare.toFixed(2)}` : '—'}
                      </p>
                      <span className="text-xs font-medium" style={{ color: s.color }}>{s.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </AppShell>
  );
}
