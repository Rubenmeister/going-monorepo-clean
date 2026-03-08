'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDriver } from '../store';
import AppShell from '../components/AppShell';

const MOCK_RATINGS = [
  {
    id: '1',
    passenger: 'Ana M.',
    rating: 5,
    comment: 'Excelente conductor, muy puntual.',
    date: '2026-02-20',
  },
  {
    id: '2',
    passenger: 'Carlos R.',
    rating: 5,
    comment: 'Vehículo limpio y cómodo.',
    date: '2026-02-18',
  },
  {
    id: '3',
    passenger: 'María G.',
    rating: 4,
    comment: 'Buen servicio en general.',
    date: '2026-02-10',
  },
  {
    id: '4',
    passenger: 'Luis P.',
    rating: 5,
    comment: 'Muy amable y profesional.',
    date: '2026-01-29',
  },
];

export default function RatingsPage() {
  const { token, isReady, init } = useDriver();
  const router = useRouter();

  useEffect(() => {
    init();
  }, [init]);
  useEffect(() => {
    if (isReady && !token) router.replace('/login');
  }, [isReady, token, router]);

  const avg =
    MOCK_RATINGS.reduce((s, r) => s + r.rating, 0) / MOCK_RATINGS.length;

  return (
    <AppShell title="Calificaciones">
      <div
        className="px-5 py-8 relative overflow-hidden"
        style={{ backgroundColor: '#011627' }}
      >
        <div
          className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-10"
          style={{ backgroundColor: '#ff4c41' }}
        />
        <p className="text-white/50 text-sm mb-1">
          Tu reputación como conductor
        </p>
        <h1 className="text-2xl font-black text-white mb-4">Calificaciones</h1>

        <div className="flex items-center gap-5">
          <div className="text-center">
            <p className="text-5xl font-black text-white">{avg.toFixed(1)}</p>
            <div className="flex gap-0.5 mt-1 justify-center">
              {[1, 2, 3, 4, 5].map((s) => (
                <span
                  key={s}
                  className="text-base"
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
            <p className="text-xs text-white/40 mt-1">
              {MOCK_RATINGS.length} reseñas
            </p>
          </div>
          <div className="flex-1 space-y-1.5">
            {[5, 4, 3, 2, 1].map((s) => {
              const count = MOCK_RATINGS.filter((r) => r.rating === s).length;
              const pct = (count / MOCK_RATINGS.length) * 100;
              return (
                <div key={s} className="flex items-center gap-2">
                  <span className="text-xs text-white/40 w-2">{s}</span>
                  <span className="text-yellow-400 text-xs">★</span>
                  <div className="flex-1 h-1.5 rounded-full bg-white/10">
                    <div
                      className="h-1.5 rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: '#fbbf24' }}
                    />
                  </div>
                  <span className="text-xs text-white/40 w-4">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">
          Reseñas recientes
        </p>
        {MOCK_RATINGS.map((r) => (
          <div key={r.id} className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white"
                  style={{ backgroundColor: '#011627' }}
                >
                  {r.passenger[0]}
                </div>
                <p className="text-sm font-bold text-gray-900">{r.passenger}</p>
              </div>
              <div className="flex gap-0.5">
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
            {r.comment && (
              <p className="text-sm text-gray-600 mb-2">{r.comment}</p>
            )}
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
