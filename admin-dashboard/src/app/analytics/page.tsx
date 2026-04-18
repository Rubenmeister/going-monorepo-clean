'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';
import { Button } from '@going-monorepo-clean/shared-ui';
import { useRouter } from 'next/navigation';
import { AdminLayout, StatCard } from '../components';
import { Loading, ErrorState } from '@going-monorepo-clean/shared-ui';
import { adminFetch, API } from '../../lib/admin-api';

/* ─── Types ─────────────────────────────────────────────────────────── */
type ServiceTab = 'transporte' | 'envios' | 'tours' | 'experiencias' | 'alojamientos' | 'global';

interface DailyStat  { date: string;  trips: number; revenue: number; }
interface RouteRank  { route: string; trips: number; revenue: number; }
interface CityRank   { city: string;  trips: number; active_drivers: number; }

interface ServiceStats {
  label:          string;
  icon:           string;
  color:          string;
  total:          number;       // viajes / reservas / envíos / noches
  revenue:        number;
  active:         number;       // conductores / anfitriones / mensajeros
  avgRating:      number;
  completionRate: number;
  vsLastWeek:     { volume: number; revenue: number };
}

interface GlobalSummary {
  totalRevenue:   number;
  totalOps:       number;       // todas las operaciones combinadas
  byService:      { label: string; icon: string; color: string; ops: number; revenue: number }[];
}

/* ─── Demo / Fallback data ───────────────────────────────────────────── */
function demoStats(tab: ServiceTab): ServiceStats {
  const MAP: Record<ServiceTab, ServiceStats> = {
    transporte:   { label: 'Transporte',   icon: '🚗', color: '#0033A0', total: 1842, revenue: 42680, active: 74,  avgRating: 4.8, completionRate: 94.2, vsLastWeek: { volume: 12, revenue: 8  } },
    envios:       { label: 'Envíos',       icon: '📦', color: '#f59e0b', total:  436, revenue:  8720, active: 28,  avgRating: 4.6, completionRate: 91.0, vsLastWeek: { volume:  7, revenue: 5  } },
    tours:        { label: 'Tours',        icon: '🗺️', color: '#16a34a', total:  218, revenue: 16350, active: 42,  avgRating: 4.9, completionRate: 98.0, vsLastWeek: { volume: 15, revenue: 20 } },
    experiencias: { label: 'Experiencias', icon: '🎭', color: '#8b5cf6', total:  184, revenue:  7360, active: 31,  avgRating: 4.7, completionRate: 96.0, vsLastWeek: { volume:  9, revenue: 11 } },
    alojamientos: { label: 'Alojamientos', icon: '🏨', color: '#ec4899', total:  312, revenue: 24960, active: 18,  avgRating: 4.6, completionRate: 92.0, vsLastWeek: { volume:  4, revenue:  6 } },
    global:       { label: 'Global',       icon: '🌐', color: '#ff4c41', total: 2992, revenue: 100070, active: 193, avgRating: 4.7, completionRate: 94.3, vsLastWeek: { volume: 10, revenue: 9  } },
  };
  return MAP[tab];
}

const DEMO_DAILY: DailyStat[] = [
  { date: '2026-04-12', trips: 310, revenue: 7140 },
  { date: '2026-04-13', trips: 284, revenue: 6540 },
  { date: '2026-04-14', trips: 298, revenue: 6880 },
  { date: '2026-04-15', trips: 315, revenue: 7260 },
  { date: '2026-04-16', trips: 342, revenue: 7890 },
  { date: '2026-04-17', trips: 293, revenue: 6768 },
  { date: '2026-04-18', trips: 200, revenue: 4200 },
];

const DEMO_ROUTES: RouteRank[] = [
  { route: 'Santo Domingo → Quito',    trips: 312, revenue: 8736 },
  { route: 'Ambato → Quito',           trips: 264, revenue: 6336 },
  { route: 'Ibarra → Quito Aeropuerto',trips: 198, revenue: 5940 },
  { route: 'Cuenca → Guayaquil',       trips: 185, revenue: 5550 },
  { route: 'Quito → Quito Aeropuerto', trips: 174, revenue: 4350 },
];

const DEMO_CITIES: CityRank[] = [
  { city: 'Quito',         trips: 680, active_drivers: 28 },
  { city: 'Santo Domingo', trips: 320, active_drivers: 14 },
  { city: 'Ambato',        trips: 210, active_drivers: 9  },
  { city: 'Ibarra',        trips: 185, active_drivers: 8  },
  { city: 'Cuenca',        trips: 160, active_drivers: 7  },
];

/* ─── API helpers ─────────────────────────────────────────────────────── */
async function loadTransportStats(token: string) {
  const [stats, daily, routes, cities] = await Promise.all([
    fetch(`${API}/admin/stats/transport`,           { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : null).catch(() => null),
    fetch(`${API}/admin/stats/transport/daily?days=7`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : null).catch(() => null),
    fetch(`${API}/admin/stats/transport/routes?limit=5`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : null).catch(() => null),
    fetch(`${API}/admin/stats/transport/cities`,    { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : null).catch(() => null),
  ]);
  return { stats, daily, routes, cities };
}

async function loadServiceCount(token: string, endpoint: string): Promise<number> {
  try {
    const res = await fetch(`${API}${endpoint}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return 0;
    const json = await res.json();
    if (Array.isArray(json)) return json.length;
    return json?.total ?? json?.count ?? json?.data?.length ?? 0;
  } catch { return 0; }
}

/* ─── Helpers ────────────────────────────────────────────────────────── */
const pct = (v: number) => (v > 0 ? `+${v}%` : `${v}%`);
const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function BarChart({ data, color, valueKey, labelFn }: {
  data: { [k: string]: any }[];
  color: string;
  valueKey: string;
  labelFn: (row: any, i: number) => string;
}) {
  const max = Math.max(...data.map(d => d[valueKey]), 1);
  return (
    <div className="flex items-end gap-2 h-36">
      {data.map((d, i) => {
        const isLast = i === data.length - 1;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[9px] font-bold text-gray-600 leading-none">{d[valueKey]}</span>
            <div className="w-full flex flex-col justify-end" style={{ height: '112px' }}>
              <div className="w-full rounded-t-md transition-all"
                style={{ height: `${Math.max((d[valueKey] / max) * 112, 6)}px`, backgroundColor: color, opacity: isLast ? 1 : 0.45 + (d[valueKey] / max) * 0.55 }} />
            </div>
            <span className={`text-[9px] font-semibold ${isLast ? 'font-black' : 'text-gray-400'}`} style={{ color: isLast ? color : undefined }}>
              {labelFn(d, i)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function HBarList({ items, color }: { items: { label: string; value: number; sub?: string }[]; color: string }) {
  const max = Math.max(...items.map(i => i.value), 1);
  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <div key={item.label}>
          <div className="flex justify-between items-center mb-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-gray-400 w-4">{i + 1}</span>
              <span className="text-sm font-semibold text-gray-800">{item.label}</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-gray-900">{item.value}</span>
              {item.sub && <span className="text-xs text-gray-400 ml-2">{item.sub}</span>}
            </div>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div className="h-2 rounded-full" style={{ width: `${(item.value / max) * 100}%`, backgroundColor: color, opacity: 0.7 + (item.value / max) * 0.3 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Tab config ─────────────────────────────────────────────────────── */
const TABS: { key: ServiceTab; label: string; icon: string; color: string }[] = [
  { key: 'transporte',   label: 'Transporte',   icon: '🚗', color: '#0033A0' },
  { key: 'envios',       label: 'Envíos',       icon: '📦', color: '#f59e0b' },
  { key: 'tours',        label: 'Tours',        icon: '🗺️', color: '#16a34a' },
  { key: 'experiencias', label: 'Experiencias', icon: '🎭', color: '#8b5cf6' },
  { key: 'alojamientos', label: 'Alojamientos', icon: '🏨', color: '#ec4899' },
  { key: 'global',       label: 'Global',       icon: '🌐', color: '#ff4c41' },
];

const KPI_LABELS: Record<ServiceTab, { total: string; active: string; unit: string }> = {
  transporte:   { total: 'Viajes totales',   active: 'Conductores activos', unit: 'viajes'     },
  envios:       { total: 'Envíos totales',   active: 'Mensajeros activos',  unit: 'envíos'     },
  tours:        { total: 'Tours realizados', active: 'Guías activos',       unit: 'tours'      },
  experiencias: { total: 'Experiencias',     active: 'Anfitriones activos', unit: 'exp.'       },
  alojamientos: { total: 'Noches vendidas',  active: 'Propiedades activas', unit: 'noches'     },
  global:       { total: 'Operaciones',      active: 'Proveedores activos', unit: 'operaciones'},
};

/* ─── Page ───────────────────────────────────────────────────────────── */
export default function AnalyticsPage() {
  const { auth } = useMonorepoApp();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<ServiceTab>('transporte');
  const [serviceStats, setServiceStats] = useState<Record<ServiceTab, ServiceStats>>({} as any);
  const [daily,   setDaily]   = useState<DailyStat[]>(DEMO_DAILY);
  const [routes,  setRoutes]  = useState<RouteRank[]>(DEMO_ROUTES);
  const [cities,  setCities]  = useState<CityRank[]>(DEMO_CITIES);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [serviceCounts, setServiceCounts] = useState<Record<string, number>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken') ?? '';

      /* Transport real stats */
      const { stats, daily: d, routes: r, cities: c } = await loadTransportStats(token);

      if (d && Array.isArray(d)) setDaily(d);
      if (r && Array.isArray(r)) setRoutes(r);
      if (c && Array.isArray(c)) setCities(c);

      /* Build serviceStats for transport from real data, others from demo */
      const transportReal: Partial<ServiceStats> = stats ? {
        total:          stats.totalTrips    ?? 0,
        revenue:        stats.totalRevenue  ?? 0,
        active:         stats.activeDrivers ?? 0,
        avgRating:      stats.avgRating     ?? 0,
        completionRate: stats.completionRate ?? 0,
        vsLastWeek:     stats.vsLastWeek
          ? { volume: stats.vsLastWeek.trips ?? 0, revenue: stats.vsLastWeek.revenue ?? 0 }
          : { volume: 0, revenue: 0 },
      } : {};

      /* Service counts from search endpoints */
      const [tourCount, expCount, accCount, parcelCount] = await Promise.all([
        loadServiceCount(token, '/tours/search'),
        loadServiceCount(token, '/experiences/search'),
        loadServiceCount(token, '/accommodations/search'),
        loadServiceCount(token, '/parcels'),
      ]);

      setServiceCounts({ tours: tourCount, experiencias: expCount, alojamientos: accCount, envios: parcelCount });

      /* Merge into serviceStats */
      const merged: Record<ServiceTab, ServiceStats> = {} as any;
      TABS.forEach(t => {
        const demo = demoStats(t.key);
        if (t.key === 'transporte') {
          merged[t.key] = { ...demo, ...transportReal };
        } else {
          const count = { tours: tourCount, experiencias: expCount, alojamientos: accCount, envios: parcelCount }[t.key];
          merged[t.key] = { ...demo, ...(count != null && count > 0 ? { total: count } : {}) };
        }
      });
      setServiceStats(merged);

    } catch {
      /* fallback to demo */
      const merged: Record<ServiceTab, ServiceStats> = {} as any;
      TABS.forEach(t => { merged[t.key] = demoStats(t.key); });
      setServiceStats(merged);
    } finally {
      setLoading(false);
      setLastUpdated(new Date());
    }
  }, []);

  useEffect(() => {
    if (!auth.isLoading) load();
    const id = setInterval(() => { if (!auth.isLoading) load(); }, 120_000);
    return () => clearInterval(id);
  }, [auth.isLoading, load]);

  if (auth.isLoading || loading) {
    return <Loading fullHeight size="lg" message="Cargando métricas..." />;
  }
  if (!auth.user?.isAdmin?.()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <ErrorState title="Acceso Denegado" description="Se requiere rol de administrador."
          action={<Button onClick={() => router.push('/')}>Volver</Button>} />
      </div>
    );
  }

  const tab = TABS.find(t => t.key === activeTab)!;
  const sv  = serviceStats[activeTab] ?? demoStats(activeTab);
  const kpi = KPI_LABELS[activeTab];
  const maxRoutes = Math.max(...routes.map(r => r.trips), 1);
  const maxCities = Math.max(...cities.map(c => c.trips), 1);

  /* Global summary */
  const allServices = TABS.filter(t => t.key !== 'global').map(t => {
    const s = serviceStats[t.key] ?? demoStats(t.key);
    return { label: t.label, icon: t.icon, color: t.color, ops: s.total, revenue: s.revenue };
  });
  const globalRevenue = allServices.reduce((s, x) => s + x.revenue, 0);
  const globalOps     = allServices.reduce((s, x) => s + x.ops, 0);

  return (
    <AdminLayout userName={auth.user.firstName} onLogout={auth.logout}>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Analítica</h1>
          <p className="text-gray-500 text-sm">Actualizado: {lastUpdated.toLocaleTimeString('es-EC')}</p>
        </div>
        <button onClick={load}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm">
          🔄 Actualizar
        </button>
      </div>

      {/* Service Tabs */}
      <div className="flex gap-1 flex-wrap bg-gray-100 rounded-xl p-1 mb-6">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── GLOBAL TAB ── */}
      {activeTab === 'global' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <StatCard icon="💰" title="Ingresos Totales"  value={`$${globalRevenue.toLocaleString('es', { minimumFractionDigits: 0 })}`} subtitle="todos los servicios" color="success" />
            <StatCard icon="📊" title="Operaciones"        value={globalOps.toLocaleString()}  subtitle="viajes + envíos + reservas" color="primary" />
            <StatCard icon="🏢" title="Comisión Going"    value={`$${(globalRevenue * 0.12).toLocaleString('es', { minimumFractionDigits: 0 })}`} subtitle="~12% promedio" color="info" />
          </div>

          {/* Revenue by service */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-5">💵 Ingresos por servicio</h3>
            <div className="space-y-4">
              {allServices.sort((a, b) => b.revenue - a.revenue).map(s => {
                const pctShare = globalRevenue > 0 ? (s.revenue / globalRevenue) * 100 : 0;
                return (
                  <div key={s.label}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm font-semibold text-gray-800">{s.icon} {s.label}</span>
                      <div className="text-right">
                        <span className="text-sm font-bold text-gray-900">${s.revenue.toLocaleString()}</span>
                        <span className="text-xs text-gray-400 ml-2">{pctShare.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div className="h-2.5 rounded-full" style={{ width: `${pctShare}%`, backgroundColor: s.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Operations by service */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-5">📈 Operaciones por servicio</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
              {allServices.map(s => (
                <div key={s.label} className="text-center p-4 rounded-xl border border-gray-100 bg-gray-50">
                  <div className="text-3xl mb-1">{s.icon}</div>
                  <p className="text-xl font-black" style={{ color: s.color }}>{s.ops.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Financial breakdown table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-base font-bold text-gray-900 mb-4">📋 Desglose financiero por servicio</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-100">
                  <th className="text-left py-2 text-gray-500 font-semibold">Servicio</th>
                  <th className="text-right py-2 text-gray-500 font-semibold">vs sem. ant.</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Ingresos brutos',        value: `$${sv.revenue.toLocaleString('es', { minimumFractionDigits: 2 })}`,              change: pct(sv.vsLastWeek.revenue), up: sv.vsLastWeek.revenue >= 0 },
                    { label: 'Comisi\xc3\xb3n Going (15%)',    value: `$${(sv.revenue * 0.15).toLocaleString('es', { minimumFractionDigits: 2 })}`,     change: pct(sv.vsLastWeek.revenue), up: true },
                    { label: 'Neto conductores (85%)',  value: `$${(sv.revenue * 0.85).toLocaleString('es', { minimumFractionDigits: 2 })}`,     change: pct(sv.vsLastWeek.revenue), up: true },
                    { label: 'Ticket promedio',         value: `$${sv.total > 0 ? (sv.revenue / sv.total).toFixed(2) : '0.00'}`,                change: '+3%',                      up: true },
                  ].map(row => (
                    <tr key={row.label} className="border-b border-gray-50">
                      <td className="py-3 text-gray-700">{row.label}</td>
                      <td className="py-3 text-right font-bold text-gray-900">{row.value}</td>
                      <td className="py-3 text-right font-semibold text-sm" style={{ color: row.up ? '#22C55E' : '#EF4444' }}>{row.change}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <div className="mt-6">
        <Button variant="ghost" onClick={() => router.push('/')}>\xe2\x86\x90 Volver al Dashboard</Button>
      </div>

    </AdminLayout>
  );
}
