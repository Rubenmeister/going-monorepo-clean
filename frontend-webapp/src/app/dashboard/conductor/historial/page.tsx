'use client';

import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/providers/auth-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.goingec.com';

interface Trip {
  id:            string;
  origin:        string | null;
  destination:   string | null;
  date:          string | null;
  amount:        number;
  status:        string;
  duration:      number | null;
  distanceKm:    number | null;
  modalidad:     string;
  paymentMethod: string | null;
}

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: 'all',         label: 'Todos' },
  { value: 'completed',   label: 'Completados' },
  { value: 'cancelled',   label: 'Cancelados' },
  { value: 'in_progress', label: 'En curso' },
];

const STATUS_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  completed:   { label: 'Completado',  bg: '#ECFDF5', color: '#10b981' },
  cancelled:   { label: 'Cancelado',   bg: '#FEF2F2', color: '#ef4444' },
  in_progress: { label: 'En curso',    bg: '#fff2f2', color: '#ff4c41' },
  pending:     { label: 'Pendiente',   bg: '#FEF3C7', color: '#f59e0b' },
  accepted:    { label: 'Aceptado',    bg: '#EFF6FF', color: '#0033A0' },
};

export default function HistorialPage() {
  const [trips, setTrips]     = useState<Trip[]>([]);
  const [filter, setFilter]   = useState('all');
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '20', page: String(page) });
    if (filter !== 'all') params.set('status', filter);

    authFetch(`${API_URL}/drivers/me/trips?${params}`)
      .then(r => r.ok ? r.json() : { data: [], meta: { totalPages: 1 } })
      .then(d => {
        setTrips(Array.isArray(d?.data) ? d.data : []);
        setTotalPages(d?.meta?.totalPages ?? 1);
      })
      .catch(() => setTrips([]))
      .finally(() => setLoading(false));
  }, [filter, page]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Historial de carreras</h1>
        <p className="text-gray-400 text-sm mt-0.5">Tus viajes registrados — filtrables por estado.</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map(f => (
          <button key={f.value}
            onClick={() => { setFilter(f.value); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
              filter === f.value
                ? 'bg-[#0033A0] text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : trips.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <p className="text-4xl mb-2">🚗</p>
          <p className="text-gray-700 font-bold">Sin carreras todavía</p>
          <p className="text-gray-400 text-sm mt-1">
            Cuando completes tu primer viaje aparecerá aquí.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {trips.map(t => {
            const badge = STATUS_BADGE[t.status] ?? { label: t.status, bg: '#F3F4F6', color: '#6b7280' };
            return (
              <div key={t.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: badge.bg, color: badge.color }}>
                      {badge.label}
                    </span>
                    {t.modalidad && (
                      <span className="text-xs text-gray-500">· {t.modalidad}</span>
                    )}
                    {t.paymentMethod && (
                      <span className="text-xs text-gray-500">· {t.paymentMethod}</span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-gray-800 truncate">
                    {t.origin ?? '—'} → {t.destination ?? '—'}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                    <span>{t.date ? new Date(t.date).toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span>
                    {t.distanceKm != null && <span>· {t.distanceKm.toFixed(1)} km</span>}
                    {t.duration  != null && <span>· {t.duration} min</span>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-[#0033A0]">${t.amount.toFixed(2)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-4">
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
