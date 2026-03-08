'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../store';
import AppShell from '../components/AppShell';

const SERVICES = [
  {
    icon: '🚗',
    title: 'Transporte',
    desc: 'Solicita un viaje',
    href: '/search?tab=transport',
    color: '#ff4c41',
    bg: '#fff0ef',
  },
  {
    icon: '🏠',
    title: 'Alojamiento',
    desc: 'Busca hospedaje',
    href: '/search?tab=accommodation',
    color: '#22c55e',
    bg: '#f0fdf4',
  },
  {
    icon: '🎭',
    title: 'Experiencias',
    desc: 'Descubre actividades',
    href: '/search?tab=experiences',
    color: '#8b5cf6',
    bg: '#f5f3ff',
  },
  {
    icon: '🎫',
    title: 'Tours',
    desc: 'Explora lugares',
    href: '/search?tab=tours',
    color: '#0ea5e9',
    bg: '#f0f9ff',
  },
];

const FEATURED = [
  {
    title: 'Casa Gangotena',
    location: 'Quito, Ecuador',
    price: 'Desde $120/noche',
    rating: 4.9,
    icon: '🏨',
    color: '#22c55e',
  },
  {
    title: 'Tour Centro Histórico',
    location: 'Quito, Ecuador',
    price: 'Desde $35/persona',
    rating: 4.8,
    icon: '🗺️',
    color: '#0ea5e9',
  },
  {
    title: 'Kayak en Baños',
    location: 'Baños, Ecuador',
    price: 'Desde $45/persona',
    rating: 4.7,
    icon: '🛶',
    color: '#8b5cf6',
  },
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
      <div className="p-4">
        {/* Greeting */}
        <div className="mb-5">
          <h1 className="text-xl font-bold text-gray-900">
            Hola, {user.firstName}! 👋
          </h1>
          <p className="text-sm text-gray-500">¿Qué necesitas hoy?</p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {SERVICES.map((s) => (
            <button
              key={s.title}
              onClick={() => router.push(s.href)}
              className="flex flex-col p-4 rounded-2xl text-left transition-transform active:scale-95"
              style={{ backgroundColor: s.bg }}
            >
              <span className="text-3xl mb-2">{s.icon}</span>
              <span className="font-bold text-sm" style={{ color: s.color }}>
                {s.title}
              </span>
              <span className="text-xs text-gray-500 mt-0.5">{s.desc}</span>
            </button>
          ))}
        </div>

        {/* Featured */}
        <h2 className="text-base font-bold text-gray-900 mb-3">
          ✨ Destacados
        </h2>
        <div className="space-y-3">
          {FEATURED.map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ backgroundColor: `${f.color}18` }}
              >
                {f.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900 truncate">
                  {f.title}
                </p>
                <p className="text-xs text-gray-400">{f.location}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-bold" style={{ color: f.color }}>
                  {f.price}
                </p>
                <p className="text-xs text-yellow-500">⭐ {f.rating}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
