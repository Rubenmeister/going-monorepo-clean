'use client';

import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/providers/auth-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api-gateway-780842550857.us-central1.run.app';

interface Rating {
  id:            string;
  rating:        number;
  comment:       string | null;
  tags:          string[];
  passengerName: string | null;
  createdAt:     string;
}
interface Summary {
  average: number;
  total:   number;
  breakdown: Record<string, number>;
}

export default function CalificacionesPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      authFetch(`${API_URL}/drivers/me/ratings/summary`).then(r => r.ok ? r.json() : null),
      authFetch(`${API_URL}/drivers/me/ratings?page=${page}&limit=20`).then(r => r.ok ? r.json() : null),
    ]).then(([s, r]) => {
      setSummary(s);
      setRatings(Array.isArray(r?.ratings) ? r.ratings : []);
      setTotalPages(r?.meta?.totalPages ?? 1);
    }).catch(() => {})
    .finally(() => setLoading(false));
  }, [page]);

  const stars = (n: number) => '⭐'.repeat(Math.max(0, Math.min(5, n)));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Calificaciones</h1>
        <p className="text-gray-400 text-sm mt-0.5">Promedio histórico y comentarios de tus pasajeros.</p>
      </div>

      {/* Summary */}
      {loading ? (
        <div className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col items-center justify-center text-center border-r-0 md:border-r border-gray-100 pr-0 md:pr-6">
            <p className="text-6xl font-black text-gray-900">{summary?.average?.toFixed(2) ?? '—'}</p>
            <p className="text-2xl text-yellow-500 mt-2">{stars(Math.round(summary?.average ?? 0))}</p>
            <p className="text-xs text-gray-400 mt-2">
              {summary?.total ?? 0} {summary?.total === 1 ? 'valoración' : 'valoraciones'}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Desglose</p>
            {[5, 4, 3, 2, 1].map(n => {
              const count = summary?.breakdown?.[String(n)] ?? 0;
              const pct = summary?.total ? (count / summary.total) * 100 : 0;
              return (
                <div key={n} className="flex items-center gap-2 text-sm">
                  <span className="w-6 font-bold text-gray-700">{n}★</span>
                  <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full bg-yellow-400 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-gray-500 w-10 text-right font-medium">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Lista de comentarios */}
      <div>
        <p className="text-sm font-bold text-gray-700 mb-3">Comentarios recientes</p>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : ratings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <p className="text-4xl mb-2">⭐</p>
            <p className="text-gray-700 font-bold">Sin comentarios todavía</p>
            <p className="text-gray-400 text-sm mt-1">
              Cuando un pasajero te califique, aparecerá aquí.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {ratings.map(r => (
              <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-500 text-sm">{stars(r.rating)}</span>
                    <span className="text-xs text-gray-400">
                      {r.passengerName ?? 'Pasajero anónimo'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {r.createdAt ? new Date(r.createdAt).toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                  </span>
                </div>
                {r.comment && (
                  <p className="text-sm text-gray-700">{r.comment}</p>
                )}
                {r.tags && r.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {r.tags.map(tag => (
                      <span key={tag} className="text-xs bg-blue-50 text-[#0033A0] px-2 py-0.5 rounded-full font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm font-bold disabled:opacity-40 hover:border-gray-300 transition-colors">
            ← Anterior
          </button>
          <span className="text-sm text-gray-500 font-medium">Página {page} de {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
            className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm font-bold disabled:opacity-40 hover:border-gray-300 transition-colors">
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}
