'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';
import { Button } from '@going-monorepo-clean/shared-ui';
import { useRouter } from 'next/navigation';
import { AdminLayout, StatCard } from '../components';
import { Loading, ErrorState } from '@going-monorepo-clean/shared-ui';
import axios from 'axios';

// ── Types ─────────────────────────────────────────────────────────────────────

interface TransportStats {
  totalTrips: number;
  activeDrivers: number;
  totalRevenue: number;
  avgRating: number;
  completionRate: number;
  activeUsers: number;
  vsLastWeek: {
    trips:    number; // % change
    revenue:  number;
    drivers:  number;
  };
}

interface DailyStat { date: string; trips: number; revenue: number; }
interface RouteRank { route: string; trips: number; revenue: number; }
interface CityRank  { city: string;  trips: number; active_drivers: number; }

// ── API ───────────────────────────────────────────────────────────────────────

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api-gateway-780842550857.us-central1.run.app';

async function fetchStats(token: string): Promise<TransportStats> {
  const { data } = await axios.get(`${API}/admin/stats/transport`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
}

async function fetchDaily(token: string): Promise<DailyStat[]> {
  const { data } = await axios.get(`${API}/admin/stats/transport/daily?days=7`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
}

async function fetchTopRoutes(token: string): Promise<RouteRank[]> {
  const { data } = await axios.get(`${API}/admin/stats/transport/routes?limit=5`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
}

async function fetchTopCities(token: string): Promise<CityRank[]> {
  const { data } = await axios.get(`${API}/admin/stats/transport/cities`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
}

// ── Demo fallback data ────────────────────────────────────────────────────────

const DEMO_STATS: TransportStats = {
  totalTrips:      1842,
  activeDrivers:   74,
  totalRevenue:    42680.5,
  avgRating:       4.8,
  completionRate:  94.2,
  activeUsers:     3120,
  vsLastWeek:      { trips: 12, revenue: 8, drivers: 5 },
};

const DEMO_DAILY: DailyStat[] = [
  { date: '2026-03-09', trips: 310, revenue: 7140.2 },
  { date: '2026-03-10', trips: 284, revenue: 6540.8 },
  { date: '2026-03-11', trips: 298, revenue: 6880.1 },
  { date: '2026-03-12', trips: 315, revenue: 7260.4 },
  { date: '2026-03-13', trips: 342, revenue: 7890.5 },
  { date: '2026-03-14', trips: 293, revenue: 6768.3 },
  { date: '2026-03-15', trips: 200, revenue: 4200.2 }, // today (partial)
];

const DEMO_ROUTES: RouteRank[] = [
  { route: 'Santo Domingo → Quito',       trips: 312, revenue: 8736 },
  { route: 'Ambato → Quito',              trips: 264, revenue: 6336 },
  { route: 'Ibarra → Quito → Aeropuerto', trips: 198, revenue: 5940 },
  { route: 'Cuenca → Guayaquil',          trips: 185, revenue: 5550 },
  { route: 'Quito → Quito Aeropuerto',    trips: 174, revenue: 4350 },
];

const DEMO_CITIES: CityRank[] = [
  { city: 'Quito',          trips: 680, active_drivers: 28 },
  { city: 'Santo Domingo',  trips: 320, active_drivers: 14 },
  { city: 'Ambato',         trips: 210, active_drivers: 9  },
  { city: 'Ibarra',         trips: 185, active_drivers: 8  },
  { city: 'Cuenca',         trips: 160, active_drivers: 7  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const pct = (v: number) => (v > 0 ? `+${v}%` : `${v}%`);
const DAYS_ES = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

// ── Component ─────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { auth } = useMonorepoApp();
  const router = useRouter();

  const [stats,  setStats]  = useState<TransportStats>(DEMO_STATS);
  const [daily,  setDaily]  = useState<DailyStat[]>(DEMO_DAILY);
  const [routes, setRoutes] = useState<RouteRank[]>(DEMO_ROUTES);
  const [cities, setCities] = useState<CityRank[]>(DEMO_CITIES);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = (auth.user as any)?.token ?? '';
      const [s, d, r, c] = await Promise.all([
        fetchStats(token),
        fetchDaily(token),
        fetchTopRoutes(token),
        fetchTopCities(token),
      ]);
      setStats(s);
      setDaily(d);
      setRoutes(r);
      setCities(c);
    } catch {
      // API no disponible — mantener demo data
    } finally {
      setLoading(false);
      setLastUpdated(new Date());
    }
  }, [auth.user]);

  useEffect(() => {
    if (!auth.isLoading) load();
    // Refresh automático cada 2 min
    const interval = setInterval(() => { if (!auth.isLoading) load(); }, 120_000);
    return () => clearInterval(interval);
  }, [auth.isLoading, load]);

  if (auth.isLoading || loading) {
    return <Loading fullHeight size="lg" message="Cargando métricas..." />;
  }

  if (!auth.user?.isAdmin?.()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <ErrorState
          title="Acceso Denegado"
          description="Se requiere rol de administrador para acceder a esta sección"
          action={<Button onClick={() => router.push('/')}>Volver</Button>}
        />
      </div>
    );
  }

  const maxTrips   = Math.max(...daily.map(d => d.trips), 1);
  const maxRevenue = Math.max(...daily.map(d => d.revenue), 1);
  const maxRoutes  = Math.max(...routes.map(r => r.trips), 1);
  const maxCities  = Math.max(...cities.map(c => c.trips), 1);

  return (
    <AdminLayout userName={auth.user.firstName} onLogout={auth.logout}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            Analítica — Transporte Intercity
          </h1>
          <p className="text-gray-500 text-sm">
            Actualizado: {lastUpdated.toLocaleTimeString('es-EC')}
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm"
        >
          🔄 Actualizar
        </button>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <StatCard icon="🚗" title="Viajes Totales"    value={stats.totalTrips.toLocaleString()}       subtitle={pct(stats.vsLastWeek.trips) + ' vs sem. ant.'}   color="primary" />
        <StatCard icon="👨‍✈️" title="Conductores Activos" value={stats.activeDrivers}                  subtitle={pct(stats.vsLastWeek.drivers) + ' vs sem. ant.'} color="info" />
        <StatCard icon="💰" title="Ingresos"          value={`$${stats.totalRevenue.toLocaleString('es', { minimumFractionDigits: 0 })}`} subtitle={pct(stats.vsLastWeek.revenue) + ' vs sem. ant.'} color="success" />
        <StatCard icon="👥" title="Usuarios Activos"  value={stats.activeUsers.toLocaleString()}       subtitle="registrados en la app"  color="info" />
        <StatCard icon="✅" title="Tasa Completación" value={`${stats.completionRate}%`}               subtitle="viajes sin cancelación" color="success" />
        <StatCard icon="⭐" title="Rating Promedio"   value={stats.avgRating.toFixed(1)}              subtitle="conductores y pasajeros" color="success" />
      </div>

      {/* ── Charts Row ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

        {/* Viajes por día */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-gray-900">Viajes — Últimos 7 días</h3>
            <span className="text-lg font-black text-[#0033A0]">
              {daily.reduce((s, d) => s + d.trips, 0).toLocaleString()}
            </span>
          </div>
          <div className="flex items-end gap-2 h-36">
            {daily.map((d, i) => {
              const isToday = i === daily.length - 1;
              const dt = new Date(d.date);
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] font-bold text-gray-600">{d.trips}</span>
                  <div className="w-full flex flex-col justify-end" style={{ height: '112px' }}>
                    <div
                      className="w-full rounded-t-md transition-all"
                      style={{
                        height: `${Math.max((d.trips / maxTrips) * 112, 6)}px`,
                        backgroundColor: isToday ? '#FFCD00' : '#0033A0',
                        opacity: isToday ? 1 : 0.5 + (d.trips / maxTrips) * 0.5,
                      }}
                    />
                  </div>
                  <span className={`text-[9px] font-semibold ${isToday ? 'text-[#0033A0] font-black' : 'text-gray-400'}`}>
                    {DAYS_ES[dt.getDay()]}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#FFCD00]" />
              <span className="text-[10px] text-gray-500 font-semibold">Hoy</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#0033A0]" />
              <span className="text-[10px] text-gray-500 font-semibold">Días anteriores</span>
            </div>
          </div>
        </div>

        {/* Ingresos por día */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-gray-900">Ingresos — Últimos 7 días</h3>
            <span className="text-lg font-black text-[#059669]">
              ${daily.reduce((s, d) => s + d.revenue, 0).toLocaleString('es', { minimumFractionDigits: 0 })}
            </span>
          </div>
          <div className="flex items-end gap-2 h-36">
            {daily.map((d, i) => {
              const isToday = i === daily.length - 1;
              const dt = new Date(d.date);
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] font-bold text-gray-600">${Math.round(d.revenue / 100) * 100 === 0 ? d.revenue.toFixed(0) : (d.revenue / 1000).toFixed(1) + 'k'}</span>
                  <div className="w-full flex flex-col justify-end" style={{ height: '112px' }}>
                    <div
                      className="w-full rounded-t-md transition-all"
                      style={{
                        height: `${Math.max((d.revenue / maxRevenue) * 112, 6)}px`,
                        backgroundColor: isToday ? '#ff4c41' : '#059669',
                        opacity: isToday ? 1 : 0.5 + (d.revenue / maxRevenue) * 0.5,
                      }}
                    />
                  </div>
                  <span className={`text-[9px] font-semibold ${isToday ? 'text-[#ff4c41] font-black' : 'text-gray-400'}`}>
                    {DAYS_ES[dt.getDay()]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Routes + Cities ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

        {/* Top rutas */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-base font-bold text-gray-900 mb-5">🛣️ Top 5 Rutas</h3>
          <div className="space-y-4">
            {routes.map((r, i) => (
              <div key={r.route}>
                <div className="flex justify-between items-center mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-gray-400 w-4">{i + 1}</span>
                    <span className="text-sm font-semibold text-gray-800">{r.route}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900">{r.trips} viajes</span>
                    <span className="text-xs text-gray-400 ml-2">${r.revenue.toLocaleString()}</span>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${(r.trips / maxRoutes) * 100}%`,
                      backgroundColor: i === 0 ? '#ff4c41' : i === 1 ? '#0033A0' : i === 2 ? '#FFCD00' : '#9CA3AF',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top ciudades */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-base font-bold text-gray-900 mb-5">📍 Ciudades más activas</h3>
          <div className="space-y-3">
            {cities.map((c, i) => (
              <div key={c.city} className="flex items-center gap-3">
                <span className="text-xs font-black text-gray-400 w-4">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-semibold text-gray-800">{c.city}</span>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-gray-500">{c.active_drivers} conductores</span>
                      <span className="font-bold text-gray-900">{c.trips} viajes</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-[#0033A0]"
                      style={{ width: `${(c.trips / maxCities) * 100}%`, opacity: 0.6 + (c.trips / maxCities) * 0.4 }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Financial Summary ──────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
        <h3 className="text-base font-bold text-gray-900 mb-4">💵 Resumen Financiero</h3>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
              <th className="text-left py-2 text-gray-500 font-semibold">Métrica</th>
              <th className="text-right py-2 text-gray-500 font-semibold">Valor</th>
              <th className="text-right py-2 text-gray-500 font-semibold">Cambio</th>
            </tr>
          </thead>
          <tbody>
            {[
              { label: 'Ingresos Brutos',      value: `$${stats.totalRevenue.toLocaleString('es', { minimumFractionDigits: 2 })}`,         change: pct(stats.vsLastWeek.revenue), up: true },
              { label: 'Comisión Plataforma (15%)', value: `$${(stats.totalRevenue * 0.15).toLocaleString('es', { minimumFractionDigits: 2 })}`, change: pct(stats.vsLastWeek.revenue), up: true },
              { label: 'Pago Neto Conductores', value: `$${(stats.totalRevenue * 0.85).toLocaleString('es', { minimumFractionDigits: 2 })}`,  change: pct(stats.vsLastWeek.revenue), up: true },
              { label: 'Ticket Promedio',       value: `$${stats.totalTrips > 0 ? (stats.totalRevenue / stats.totalTrips).toFixed(2) : '0.00'}`, change: '+3%', up: true },
            ].map(row => (
              <tr key={row.label} style={{ borderBottom: '1px solid #f9fafb' }}>
                <td className="py-3 text-gray-700">{row.label}</td>
                <td className="py-3 text-right font-bold text-gray-900">{row.value}</td>
                <td className="py-3 text-right font-semibold text-sm" style={{ color: row.up ? '#22C55E' : '#EF4444' }}>{row.change}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Button variant="ghost" onClick={() => router.push('/')}>
        ← Volver al Dashboard
      </Button>
    </AdminLayout>
  );
}
