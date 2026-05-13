'use client';

import { useEffect, useMemo, useState } from 'react';
import { authFetch } from '@/lib/providers/auth-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.goingec.com';

interface PeriodStats { trips: number; earnings: number }
interface Stats {
  today:    PeriodStats;
  week:     PeriodStats;
  month:    PeriodStats;
  lifetime: { trips: number };
}

interface Trip {
  id: string; date: string | null; amount: number;
  modalidad: string; paymentMethod: string | null; status: string;
}

export default function GananciasPage() {
  const [stats, setStats]     = useState<Stats | null>(null);
  const [trips, setTrips]     = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      authFetch(`${API_URL}/drivers/me/stats`).then(r => r.ok ? r.json() : null),
      // 30 días de trips para hacer breakdown por modalidad/método
      authFetch(`${API_URL}/drivers/me/trips?status=completed&limit=200`).then(r => r.ok ? r.json() : { data: [] }),
    ]).then(([s, t]) => {
      setStats(s);
      setTrips(Array.isArray(t?.data) ? t.data : []);
    }).catch(() => {})
    .finally(() => setLoading(false));
  }, []);

  // Breakdown por modalidad (privado/compartido) y método de pago — últimos 30 días
  const breakdown = useMemo(() => {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30);
    const recent = trips.filter(t => t.date && new Date(t.date) >= cutoff && t.status === 'completed');

    const byMode: Record<string, { trips: number; earnings: number }> = {};
    const byPay:  Record<string, { trips: number; earnings: number }> = {};

    for (const t of recent) {
      const mode = t.modalidad ?? 'privado';
      byMode[mode] ??= { trips: 0, earnings: 0 };
      byMode[mode].trips    += 1;
      byMode[mode].earnings += t.amount;

      const pay = t.paymentMethod ?? 'desconocido';
      byPay[pay] ??= { trips: 0, earnings: 0 };
      byPay[pay].trips    += 1;
      byPay[pay].earnings += t.amount;
    }

    return { byMode, byPay, total: recent.length };
  }, [trips]);

  if (loading) return <Skeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Ganancias</h1>
        <p className="text-gray-400 text-sm mt-0.5">Resumen por período y desglose de los últimos 30 días.</p>
      </div>

      {/* Períodos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <PeriodCard title="Hoy"             value={stats?.today.earnings} trips={stats?.today.trips} />
        <PeriodCard title="Últimos 7 días"  value={stats?.week.earnings}  trips={stats?.week.trips} />
        <PeriodCard title="Últimos 30 días" value={stats?.month.earnings} trips={stats?.month.trips} highlighted />
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            Por modalidad — 30 días
          </p>
          {Object.keys(breakdown.byMode).length === 0 ? (
            <p className="text-sm text-gray-400 py-4">Sin datos en los últimos 30 días</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(breakdown.byMode).map(([mode, v]) => (
                <BreakdownRow key={mode}
                  label={mode === 'compartido' ? '🤝 Compartido' : '🔒 Privado'}
                  trips={v.trips}
                  earnings={v.earnings}
                  pct={breakdown.total ? (v.trips / breakdown.total) * 100 : 0}
                />
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            Por método de pago — 30 días
          </p>
          {Object.keys(breakdown.byPay).length === 0 ? (
            <p className="text-sm text-gray-400 py-4">Sin datos en los últimos 30 días</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(breakdown.byPay).map(([pay, v]) => {
                const icon = pay === 'cash' ? '💵' : pay === 'card' ? '💳' : pay === 'qr' ? '📱' : '❓';
                const label = pay === 'cash' ? 'Efectivo' : pay === 'card' ? 'Tarjeta' : pay === 'qr' ? 'QR' : pay;
                return (
                  <BreakdownRow key={pay}
                    label={`${icon} ${label}`}
                    trips={v.trips}
                    earnings={v.earnings}
                    pct={breakdown.total ? (v.trips / breakdown.total) * 100 : 0}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-400 text-center">
        Los pagos en efectivo se cobran directamente al pasajero.
        Los pagos con tarjeta/QR se liquidan según el calendario de Going.
      </p>
    </div>
  );
}

function PeriodCard({ title, value, trips, highlighted }: {
  title: string; value?: number; trips?: number; highlighted?: boolean;
}) {
  return (
    <div className={`rounded-2xl p-5 border shadow-sm ${
      highlighted
        ? 'bg-gradient-to-br from-[#0033A0] to-[#001f6b] border-transparent text-white'
        : 'bg-white border-gray-100'
    }`}>
      <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${highlighted ? 'text-white/60' : 'text-gray-400'}`}>{title}</p>
      <p className={`text-3xl font-black ${highlighted ? 'text-white' : 'text-gray-900'}`}>
        {value != null ? `$${value.toFixed(2)}` : '—'}
      </p>
      <p className={`text-xs mt-1 ${highlighted ? 'text-white/60' : 'text-gray-500'}`}>
        {trips ?? 0} {trips === 1 ? 'carrera' : 'carreras'}
      </p>
    </div>
  );
}

function BreakdownRow({ label, trips, earnings, pct }: {
  label: string; trips: number; earnings: number; pct: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-gray-700 font-medium">{label}</span>
        <span className="text-gray-900 font-bold">${earnings.toFixed(2)}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full bg-[#0033A0] transition-all" style={{ width: `${Math.min(100, pct)}%` }} />
        </div>
        <span className="text-xs text-gray-400 font-medium min-w-[3rem] text-right">{trips} viajes</span>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-40 bg-gray-200 rounded animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}
