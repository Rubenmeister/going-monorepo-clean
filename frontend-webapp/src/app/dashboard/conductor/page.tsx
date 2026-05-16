'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { authFetch } from '@/lib/providers/auth-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.goingec.com';

interface PeriodStats { trips: number; earnings: number }
interface Stats {
  today:    PeriodStats;
  week:     PeriodStats;
  month:    PeriodStats;
  lifetime: { trips: number };
}
interface RatingSummary { average: number; total: number; breakdown: Record<string, number> }

export default function ConductorOverview() {
  const [stats, setStats]       = useState<Stats | null>(null);
  const [rating, setRating]     = useState<RatingSummary | null>(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      authFetch(`${API_URL}/drivers/me/stats`).then(r => r.ok ? r.json() : null),
      authFetch(`${API_URL}/drivers/me/ratings/summary`).then(r => r.ok ? r.json() : null),
    ]).then(([s, r]) => {
      setStats(s);
      setRating(r);
    }).catch(() => {})
    .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Resumen</h1>
        <p className="text-gray-400 text-sm mt-0.5">Tus carreras, ganancias y desempeño en un vistazo.</p>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Hoy"      sub="ganancia"      value={fmtMoney(stats?.today.earnings)}  detail={`${stats?.today.trips ?? 0} carreras`} accent="#0033A0" />
        <KpiCard label="7 días"   sub="ganancia"      value={fmtMoney(stats?.week.earnings)}   detail={`${stats?.week.trips ?? 0} carreras`}  accent="#0033A0" />
        <KpiCard label="30 días"  sub="ganancia"      value={fmtMoney(stats?.month.earnings)}  detail={`${stats?.month.trips ?? 0} carreras`} accent="#10b981" />
        <KpiCard label="Histórico" sub="carreras"     value={`${stats?.lifetime.trips ?? 0}`}  detail="completadas"                          accent="#f59e0b" />
      </div>

      {/* Rating + accesos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Calificación</p>
          <div className="flex items-baseline gap-2">
            <p className="text-4xl font-black text-gray-900">{rating?.average?.toFixed(2) ?? '—'}</p>
            <p className="text-yellow-500 text-2xl">⭐</p>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {rating?.total ? `${rating.total} valoraciones` : 'Sin valoraciones aún'}
          </p>
          <Link href="/dashboard/conductor/calificaciones"
            className="mt-4 inline-block text-xs font-bold text-[#0033A0] hover:underline">
            Ver desglose →
          </Link>
        </div>

        <Link href="/dashboard/conductor/historial"
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
          <span className="text-3xl">🕐</span>
          <p className="font-bold text-gray-900 mt-2">Historial de carreras</p>
          <p className="text-xs text-gray-400 mt-1">Filtra por estado y revisa tarifas, distancias y duraciones.</p>
        </Link>

        <Link href="/dashboard/conductor/ganancias"
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
          <span className="text-3xl">💰</span>
          <p className="font-bold text-gray-900 mt-2">Detalle de ganancias</p>
          <p className="text-xs text-gray-400 mt-1">Por período, modalidad y método de pago.</p>
        </Link>

        <Link href="/dashboard/conductor/documentos"
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
          <span className="text-3xl">📄</span>
          <p className="font-bold text-gray-900 mt-2">Documentos</p>
          <p className="text-xs text-gray-400 mt-1">Estado de cédula, licencia, SOAT y matrícula.</p>
        </Link>

        <Link href="/dashboard/conductor/calificaciones"
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
          <span className="text-3xl">⭐</span>
          <p className="font-bold text-gray-900 mt-2">Calificaciones</p>
          <p className="text-xs text-gray-400 mt-1">Comentarios de tus pasajeros y promedio histórico.</p>
        </Link>

        <Link href="/dashboard/conductor/perfil"
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
          <span className="text-3xl">👤</span>
          <p className="font-bold text-gray-900 mt-2">Mi perfil</p>
          <p className="text-xs text-gray-400 mt-1">Datos personales y de tu vehículo.</p>
        </Link>

      </div>
    </div>
  );
}

function KpiCard({ label, sub, value, detail, accent }: {
  label: string; sub: string; value: string; detail: string; accent: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-xs text-gray-400 mb-1">{sub}</p>
      <p className="text-2xl font-black" style={{ color: accent }}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{detail}</p>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}

function fmtMoney(n?: number): string {
  if (n == null) return '—';
  return `$${n.toFixed(2)}`;
}
