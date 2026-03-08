'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../store';
import AppShell from '../components/AppShell';

const SERVICES = [
  {
    icon: '🚗',
    title: 'Transporte',
    desc: 'Solicita un viaje puerta a puerta',
    href: '/search?tab=transport',
    color: '#ff4c41',
    bg: '#fff0ef',
  },
  {
    icon: '🏠',
    title: 'Alojamiento',
    desc: 'Encuentra el hospedaje perfecto',
    href: '/search?tab=accommodation',
    color: '#22c55e',
    bg: '#f0fdf4',
  },
  {
    icon: '🎭',
    title: 'Experiencias',
    desc: 'Vive actividades únicas',
    href: '/search?tab=experiences',
    color: '#8b5cf6',
    bg: '#f5f3ff',
  },
  {
    icon: '🎫',
    title: 'Tours',
    desc: 'Explora los mejores destinos',
    href: '/search?tab=tours',
    color: '#0ea5e9',
    bg: '#f0f9ff',
  },
  {
    icon: '📦',
    title: 'Envíos',
    desc: 'Envía paquetes de forma segura',
    href: '/search?tab=envios',
    color: '#f59e0b',
    bg: '#fffbeb',
  },
  {
    icon: '🏢',
    title: 'Corporativo',
    desc: 'Soluciones para empresas',
    href: '/search?tab=corporate',
    color: '#6366f1',
    bg: '#f0f0ff',
  },
];

const FEATURED = [
  {
    title: 'Casa Gangotena',
    location: 'Quito Centro Histórico',
    price: 'Desde $120/noche',
    rating: 4.9,
    icon: '🏨',
    color: '#22c55e',
    tag: 'Alojamiento',
  },
  {
    title: 'Tour Cotopaxi',
    location: 'Cotopaxi, Ecuador',
    price: 'Desde $85/persona',
    rating: 4.8,
    icon: '🏔️',
    color: '#0ea5e9',
    tag: 'Tour',
  },
  {
    title: 'Kayak en Baños',
    location: 'Baños de Agua Santa',
    price: 'Desde $45/persona',
    rating: 4.7,
    icon: '🛶',
    color: '#8b5cf6',
    tag: 'Experiencia',
  },
];

const STATS = [
  { value: '50K+', label: 'Usuarios activos' },
  { value: '200+', label: 'Destinos' },
  { value: '98%', label: 'Satisfacción' },
  { value: '24/7', label: 'Soporte' },
];

export default function HomePage() {
  const { user, token, isReady, init } = useAuth();
  const router = useRouter();

  useEffect(() => {
    init();
  }, [init]);
  useEffect(() => {
    if (isReady && !token) router.replace('/login');
  }, [isReady, token, router]);

  if (!isReady || !user) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: '#011627' }}
      >
        <div
          className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: '#ff4c41', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  return (
    <AppShell>
      {/* ── Hero banner ── */}
      <section
        className="px-5 pt-8 pb-10 relative overflow-hidden"
        style={{ backgroundColor: '#011627' }}
      >
        <div className="relative z-10">
          <p
            className="text-sm font-semibold mb-1"
            style={{ color: '#ff4c41' }}
          >
            ¡Bienvenido de vuelta!
          </p>
          <h1 className="text-2xl font-black text-white leading-tight mb-2">
            Hola, {user.firstName} 👋
          </h1>
          <p className="text-sm text-white/50 mb-6">¿A dónde quieres ir hoy?</p>
          {/* Search bar */}
          <button
            onClick={() => router.push('/search')}
            className="w-full flex items-center gap-3 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-left hover:bg-white/15 transition"
          >
            <span className="text-white/50">🔍</span>
            <span className="text-sm text-white/40">
              Buscar servicios, destinos...
            </span>
          </button>
        </div>
        {/* Decorative circles */}
        <div
          className="absolute -right-16 -top-16 w-48 h-48 rounded-full opacity-10"
          style={{ backgroundColor: '#ff4c41' }}
        />
        <div
          className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full opacity-5"
          style={{ backgroundColor: '#ff4c41' }}
        />
      </section>

      {/* ── Stats strip ── */}
      <section className="grid grid-cols-4 bg-white border-b border-gray-100 shadow-sm">
        {STATS.map((s) => (
          <div key={s.label} className="flex flex-col items-center py-3 px-1">
            <p className="font-black text-base" style={{ color: '#ff4c41' }}>
              {s.value}
            </p>
            <p className="text-xs text-gray-400 text-center leading-tight mt-0.5">
              {s.label}
            </p>
          </div>
        ))}
      </section>

      {/* ── Services grid ── */}
      <section className="px-4 py-6">
        <h2 className="text-base font-bold text-gray-900 mb-4">
          Nuestros Servicios
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {SERVICES.map((s) => (
            <button
              key={s.title}
              onClick={() => router.push(s.href)}
              className="flex flex-col p-4 rounded-2xl text-left transition-all hover:shadow-md active:scale-95 bg-white border border-gray-100"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3"
                style={{ backgroundColor: s.bg }}
              >
                {s.icon}
              </div>
              <span className="font-bold text-sm text-gray-900">{s.title}</span>
              <span className="text-xs text-gray-400 mt-1 leading-snug">
                {s.desc}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ── Featured ── */}
      <section className="px-4 pb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900">✨ Destacados</h2>
          <button
            onClick={() => router.push('/search')}
            className="text-xs font-semibold"
            style={{ color: '#ff4c41' }}
          >
            Ver todo →
          </button>
        </div>
        <div className="space-y-3">
          {FEATURED.map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4"
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ backgroundColor: `${f.color}15` }}
              >
                {f.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-bold text-sm text-gray-900 truncate">
                    {f.title}
                  </p>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
                    style={{ backgroundColor: `${f.color}15`, color: f.color }}
                  >
                    {f.tag}
                  </span>
                </div>
                <p className="text-xs text-gray-400">{f.location}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <p className="text-xs font-bold" style={{ color: f.color }}>
                    {f.price}
                  </p>
                  <p className="text-xs text-yellow-500">⭐ {f.rating}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
