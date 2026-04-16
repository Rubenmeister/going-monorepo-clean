import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../store';
import AppShell from '../components/AppShell';

const SECONDARY = [
  { icon: '🚗', title: 'Privado', href: '/transport?mode=private', color: '#3b82f6', bg: '#eff6ff' },
  { icon: '🏠', title: 'Alojamiento', href: '/search?tab=accommodation', color: '#22c55e', bg: '#f0fdf4' },
  { icon: '🎫', title: 'Tours', href: '/search?tab=tours', color: '#0ea5e9', bg: '#f0f9ff' },
  { icon: '🏢', title: 'Corporativo', href: '/corporate', color: '#6366f1', bg: '#f0f0ff' },
  { icon: '🎭', title: 'Experiencias', href: '/search?tab=experiences', color: '#8b5cf6', bg: '#f5f3ff' },
];

const ROUTES = [
  { from: 'Quito', to: 'Baños', duration: '3h 30m', price: '$8', seats: '3 disponibles' },
  { from: 'Quito', to: 'Guayaquil', duration: '8h', price: '$15', seats: '5 disponibles' },
  { from: 'Quito', to: 'Cuenca', duration: '9h', price: '$18', seats: '2 disponibles' },
];

export default function HomePage() {
  const { user, token, isReady, init } = useAuth();
  const router = useRouter();

  useEffect(() => { init(); }, [init]);
  useEffect(() => {
    if (isReady && !token) router.replace('/login');
  }, [isReady, token, router]);

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

      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-5 pt-7 pb-8" style={{ backgroundColor: '#011627' }}>
        {/* Decoración */}
        <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full opacity-10"
          style={{ backgroundColor: '#ff4c41' }} />
        <div className="absolute right-6 bottom-0 w-28 h-28 rounded-full opacity-5"
          style={{ backgroundColor: '#ff4c41' }} />

        <div className="relative z-10">
          <p className="text-xs font-bold mb-1" style={{ color: '#ff4c41' }}>
            Hola, {user.firstName} 👋
          </p>
          <h1 className="text-2xl font-black text-white leading-tight mb-6">
            ¿A dónde vas<br/>hoy?
          </h1>

          {/* ── CTAs principales ── */}
          <div className="grid grid-cols-2 gap-3">

            {/* Compartido — primario */}
            <button
              onClick={() => router.push('/transport?mode=shared')}
              className="col-span-2 flex items-center gap-4 rounded-2xl px-5 py-4 text-left transition-all active:scale-95"
              style={{ backgroundColor: '#ff4c41', boxShadow: '0 6px 24px rgba(255,76,65,0.40)' }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                🚍
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-white text-base leading-tight">Viajar compartido</p>
                <p className="text-white/70 text-xs mt-0.5">Rutas intercantonales · Desde $5</p>
              </div>
              <span className="text-white/80 text-lg flex-shrink-0">→</span>
            </button>

            {/* Envíos — secundario pero prominente */}
            <button
              onClick={() => router.push('/envios')}
              className="flex items-center gap-3 rounded-2xl px-4 py-4 text-left transition-all active:scale-95"
              style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ backgroundColor: 'rgba(245,158,11,0.2)' }}>
                📦
              </div>
              <div className="min-w-0">
                <p className="font-bold text-white text-sm leading-tight">Enviar</p>
                <p className="text-white/50 text-xs mt-0.5">Desde $5 · GPS</p>
              </div>
            </button>

            {/* Transporte privado */}
            <button
              onClick={() => router.push('/transport?mode=private')}
              className="flex items-center gap-3 rounded-2xl px-4 py-4 text-left transition-all active:scale-95"
              style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ backgroundColor: 'rgba(59,130,246,0.2)' }}>
                🚗
              </div>
              <div className="min-w-0">
                <p className="font-bold text-white text-sm leading-tight">Privado</p>
                <p className="text-white/50 text-xs mt-0.5">SUV · VAN · Bus</p>
              </div>
            </button>

          </div>
        </div>
      </section>

      {/* ── Rutas populares ── */}
      <section className="px-5 pt-5 pb-2">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            🔥 Rutas populares
          </p>
          <button
            onClick={() => router.push('/transport?mode=shared')}
            className="text-xs font-semibold"
            style={{ color: '#ff4c41' }}
          >
            Ver todas →
          </button>
        </div>
        <div className="space-y-2">
          {ROUTES.map((r) => (
            <button
              key={r.to}
              onClick={() => router.push(`/transport?mode=shared&from=${r.from}&to=${r.to}`)}
              className="w-full bg-white rounded-2xl px-4 py-3 flex items-center gap-3 text-left transition-all active:scale-95"
              style={{ border: '1px solid #f0f0f0' }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-gray-900">{r.from}</span>
                  <span className="text-gray-300 text-xs">→</span>
                  <span className="font-bold text-sm text-gray-900">{r.to}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-400">⏱ {r.duration}</span>
                  <span className="text-gray-200 text-xs">·</span>
                  <span className="text-xs text-gray-400">👥 {r.seats}</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="font-black text-base" style={{ color: '#ff4c41' }}>{r.price}</span>
                <p className="text-xs text-gray-400">por asiento</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ── Divisor ── */}
      <div className="mx-5 my-4 h-px bg-gray-100" />

      {/* ── Más servicios ── */}
      <section className="px-5 pb-6">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
          Más servicios
        </p>
        <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {SECONDARY.map((s) => (
            <button
              key={s.title}
              onClick={() => router.push(s.href)}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 transition-all active:scale-95"
              style={{ width: 64 }}
            >
              <div className="w-13 h-13 rounded-2xl flex items-center justify-center text-2xl"
                style={{ backgroundColor: s.bg, width: 52, height: 52 }}>
                {s.icon}
              </div>
              <span className="text-xs font-semibold text-gray-500 text-center leading-tight">
                {s.title}
              </span>
            </button>
          ))}
        </div>
      </section>

    </AppShell>
  );
}
