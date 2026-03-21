'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../store';
import AppShell from '../components/AppShell';

const MOCK_REVIEWS = [
  {
    id: '1',
    service: 'Tour Centro Histórico',
    rating: 5,
    comment: 'Excelente experiencia, el guía fue muy amable.',
    date: '2026-02-15',
  },
  {
    id: '2',
    service: 'Transporte Aeropuerto',
    rating: 4,
    comment: 'Puntual y cómodo, lo recomiendo.',
    date: '2026-01-28',
  },
  {
    id: '3',
    service: 'Alojamiento Quito',
    rating: 5,
    comment: 'Increíble lugar, muy limpio y bien ubicado.',
    date: '2026-01-10',
  },
];

export default function ReviewsPage() {
  const { token, isReady, init } = useAuth();
  const router = useRouter();
  const [filter, setFilter] = useState(0); // 0 = all

  useEffect(() => {
    init();
  }, [init]);
  useEffect(() => {
    if (isReady && !token) router.replace('/login');
  }, [isReady, token, router]);

  const avg =
    MOCK_REVIEWS.reduce((s, r) => s + r.rating, 0) / MOCK_REVIEWS.length;

  return (
    <AppShell title="Reseñas">
      {/* Header */}
      <div
        className="px-5 py-8 relative overflow-hidden"
        style={{ backgroundColor: '#011627' }}
      >
        <div
          className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-10"
          style={{ backgroundColor: '#ff4c41' }}
        />
        <p className="text-white/50 text-sm mb-1">Tus opiniones</p>
        <h1 className="text-2xl font-black text-white mb-4">Mis Reseñas</h1>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-3xl font-black text-white">{avg.toFixed(1)}</p>
            <div className="flex gap-0.5 mt-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <span
                  key={s}
                  className="text-sm"
                  style={{
                    color:
                      s <= Math.round(avg)
                        ? '#fbbf24'
                        : 'rgba(255,255,255,0.2)',
                  }}
                >
                  ★
                </span>
              ))}
            </div>
          </div>
          <div className="flex-1 space-y-1">
            {[5, 4, 3, 2, 1].map((s) => {
              const count = MOCK_REVIEWS.filter((r) => r.rating === s).length;
              const pct = (count / MOCK_REVIEWS.length) * 100;
              return (
                <div key={s} className="flex items-center gap-2">
                  <span className="text-xs text-white/40 w-2">{s}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-white/10">
                    <div
                      className="h-1.5 rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: '#ff4c41' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 px-4 py-3 bg-white border-b border-gray-100 overflow-x-auto">
        {['Todas', '⭐⭐⭐⭐⭐', '⭐⭐⭐⭐', '⭐⭐⭐'].map((f, i) => (
          <button
            key={f}
            onClick={() => setFilter(i)}
            className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0 transition-colors"
            style={
              filter === i
                ? { backgroundColor: '#ff4c41', color: '#fff' }
                : { backgroundColor: '#f1f5f9', color: '#6b7280' }
            }
          >
            {f}
          </button>
        ))}
      </div>

      <div className="px-4 py-4 space-y-3">
        <p className="text-xs text-gray-400 font-medium">
          {MOCK_REVIEWS.length} reseñas
        </p>
        {MOCK_REVIEWS.map((r) => (
          <div
            key={r.id}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
          >
            <div className="flex items-start justify-between mb-2">
              <p className="font-bold text-sm text-gray-900">{r.service}</p>
              <div className="flex gap-0.5 flex-shrink-0 ml-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <span
                    key={s}
                    className="text-sm"
                    style={{ color: s <= r.rating ? '#fbbf24' : '#e5e7eb' }}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-2">{r.comment}</p>
            <p className="text-xs text-gray-400">
              {new Date(r.date).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
