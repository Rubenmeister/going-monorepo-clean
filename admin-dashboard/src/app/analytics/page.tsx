'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { useMonorepoApp } from '@/lib/providers';
import { Button } from '@/lib/shared-ui';
import { useRouter } from 'next/navigation';
import { AdminLayout, StatCard } from '../components';
import { Loading, ErrorState } from '@/lib/shared-ui';
import { adminFetch, API } from '../../lib/admin-api';

/* ─── Types ────────────────────────────────────────────────────────────── */
type ServiceTab = 'transporte' | 'envios' | 'tours' | 'experiencias' | 'alojamientos' | 'global';

interface DailyStat  { date: string; trips: number; revenue: number; }
interface RouteRank  { route: string; trips: number; revenue: number; }
interface CityRank   { city: string; trips: number; active_drivers: number; }

interface ServiceStats {
  label: string; icon: string; color: string;
  total: number; revenue: number; active: number;
  avgRating: number; completionRate: number;
  vsLastWeek: { volume: number; revenue: number };
  isReal?: boolean;
}

/* ─── Base (sin datos) ──────────────────────────────────────────────────────
 * Solo provee label/icono/color para poder renderizar las tarjetas; las
 * métricas van en CERO. Antes esto devolvía números inventados que se mostraban
 * como si fueran reales — eso engañaba al admin. Ahora, si el backend no
 * responde, se ve 0 / "Sin datos", no cifras falsas. */
function emptyStats(tab: ServiceTab): ServiceStats {
  const META: Record<ServiceTab, Pick<ServiceStats,'label'|'icon'|'color'>> = {
    transporte:   { label:'Transporte',   icon:'🚗', color:'#0033A0' },
    envios:       { label:'Envíos',       icon:'📦', color:'#f59e0b' },
    tours:        { label:'Tours',        icon:'🗺️', color:'#16a34a' },
    experiencias: { label:'Experiencias', icon:'🎭', color:'#8b5cf6' },
    alojamientos: { label:'Alojamientos', icon:'🏨', color:'#ec4899' },
    global:       { label:'Global',       icon:'🌐', color:'#ff4c41' },
  };
  return { ...META[tab], total:0, revenue:0, active:0, avgRating:0, completionRate:0, vsLastWeek:{volume:0,revenue:0} };
}


/* ─── Fetch helpers ─────────────────────────────────────────────────────── */
async function safeGet<T>(token: string, path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
    return res.ok ? res.json() : null;
  } catch { return null; }
}

async function safeCount(token: string, path: string): Promise<number> {
  const json = await safeGet<any>(token, path);
  if (!json) return 0;
  if (Array.isArray(json)) return json.length;
  return json?.total ?? json?.count ?? json?.data?.length ?? json?.items?.length ?? 0;
}

/* ─── UI Components ─────────────────────────────────────────────────────── */
const pct = (v: number) => v > 0 ? `+${v}%` : `${v}%`;

function DataBadge({ isReal }: { isReal?: boolean }) {
  return isReal
    ? <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold">● Datos reales</span>
    : <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">◐ Sin datos</span>;
}

function BarChart({ data, color, valueKey, labelFn }: {
  data: Record<string,any>[]; color: string; valueKey: string; labelFn:(r:any,i:number)=>string;
}) {
  const max = Math.max(...data.map(d => d[valueKey]), 1);
  return (
    <div className="flex items-end gap-1.5 h-36">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-[9px] font-bold text-gray-600 leading-none">{d[valueKey]}</span>
          <div className="w-full flex flex-col justify-end" style={{ height:'112px' }}>
            <div className="w-full rounded-t-md"
              style={{ height:`${Math.max((d[valueKey]/max)*112,4)}px`, backgroundColor:color, opacity:0.45+(d[valueKey]/max)*0.55 }} />
          </div>
          <span className="text-[9px] text-gray-400">{labelFn(d,i)}</span>
        </div>
      ))}
    </div>
  );
}

function HBar({ items, color }: { items:{label:string;value:number;sub?:string}[]; color:string }) {
  const max = Math.max(...items.map(i=>i.value),1);
  return (
    <div className="space-y-3">
      {items.map((item,i) => (
        <div key={item.label}>
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-gray-400 w-4">{i+1}</span>
              <span className="text-sm font-semibold text-gray-800">{item.label}</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-gray-900">{item.value}</span>
              {item.sub && <span className="text-xs text-gray-400 ml-2">{item.sub}</span>}
            </div>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div className="h-2 rounded-full" style={{width:`${(item.value/max)*100}%`, backgroundColor:color, opacity:0.7+(item.value/max)*0.3}} />
          </div>
        </div>
      ))}
    </div>
  );
}

function KpiGrid({ sv, kpi }: { sv:ServiceStats; kpi:{total:string;active:string;unit:string} }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <p className="text-xs text-gray-500 font-medium">{kpi.total}</p>
        <p className="text-2xl font-black mt-1" style={{color:sv.color}}>{sv.total.toLocaleString()}</p>
        <p className="text-xs mt-1" style={{color:sv.vsLastWeek.volume>=0?'#22c55e':'#ef4444'}}>{pct(sv.vsLastWeek.volume)} vs sem. ant.</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <p className="text-xs text-gray-500 font-medium">Ingresos</p>
        <p className="text-2xl font-black mt-1 text-gray-900">${sv.revenue.toLocaleString()}</p>
        <p className="text-xs mt-1" style={{color:sv.vsLastWeek.revenue>=0?'#22c55e':'#ef4444'}}>{pct(sv.vsLastWeek.revenue)} vs sem. ant.</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <p className="text-xs text-gray-500 font-medium">{kpi.active}</p>
        <p className="text-2xl font-black mt-1 text-gray-900">{sv.active}</p>
        <p className="text-xs text-gray-400 mt-1">activos en plataforma</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <p className="text-xs text-gray-500 font-medium">Completación</p>
        <p className="text-2xl font-black mt-1 text-gray-900">{sv.completionRate}%</p>
        <p className="text-xs mt-1" style={{color:sv.avgRating>=4.5?'#22c55e':'#f59e0b'}}>⭐ {sv.avgRating} promedio</p>
      </div>
    </div>
  );
}

/* Conversion funnel */
function FunnelSection({ funnel }: { funnel:{label:string;value:number;color:string}[] }) {
  const top = funnel[0]?.value ?? 1;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-bold text-gray-900">🔽 Funnel de conversión</h3>
      </div>
      <div className="space-y-3">
        {funnel.map((stage, i) => {
          const width = top > 0 ? (stage.value / top) * 100 : 0;
          const prev = i > 0 ? funnel[i-1].value : null;
          const convRate = prev && prev > 0 ? ((stage.value / prev) * 100).toFixed(1) : null;
          return (
            <div key={stage.label}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-semibold text-gray-700">{stage.label}</span>
                <div className="flex items-center gap-3">
                  {convRate && <span className="text-xs text-gray-400">↳ {convRate}% del anterior</span>}
                  <span className="text-sm font-bold text-gray-900">{stage.value.toLocaleString()}</span>
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div className="h-3 rounded-full transition-all"
                  style={{width:`${width}%`, backgroundColor:stage.color}} />
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-gray-400 mt-4">
        Conversión global: {top > 0 && funnel.length > 0
          ? ((funnel[funnel.length-1].value / top)*100).toFixed(1)
          : '—'}% (registro → pago completado)
      </p>
    </div>
  );
}

/* ─── Tab config ─────────────────────────────────────────────────────────── */
const TABS: {key:ServiceTab;label:string;icon:string;color:string}[] = [
  {key:'transporte',   label:'Transporte',   icon:'🚗', color:'#0033A0'},
  {key:'envios',       label:'Envíos',       icon:'📦', color:'#f59e0b'},
  {key:'tours',        label:'Tours',        icon:'🗺️', color:'#16a34a'},
  {key:'experiencias', label:'Experiencias', icon:'🎭', color:'#8b5cf6'},
  {key:'alojamientos', label:'Alojamientos', icon:'🏨', color:'#ec4899'},
  {key:'global',       label:'Global',       icon:'🌐', color:'#ff4c41'},
];

const KPI_LABELS: Record<ServiceTab,{total:string;active:string;unit:string}> = {
  transporte:   {total:'Viajes totales',   active:'Conductores activos', unit:'viajes'},
  envios:       {total:'Envíos totales',   active:'Mensajeros activos',  unit:'envíos'},
  tours:        {total:'Tours realizados', active:'Guías activos',       unit:'tours'},
  experiencias: {total:'Experiencias',     active:'Anfitriones activos', unit:'exp.'},
  alojamientos: {total:'Noches vendidas',  active:'Propiedades activas', unit:'noches'},
  global:       {total:'Operaciones',      active:'Proveedores activos', unit:'ops'},
};

const SERVICE_ENDPOINTS: Partial<Record<ServiceTab,{list:string;stats:string}>> = {
  envios:       {list:'/parcels?limit=100',       stats:'/admin/stats/parcels'},
  tours:        {list:'/tours/search?limit=100',  stats:'/admin/stats/tours'},
  experiencias: {list:'/experiences/search?limit=100', stats:'/admin/stats/experiences'},
  alojamientos: {list:'/accommodations/search?limit=100', stats:'/admin/stats/accommodations'},
};

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function AnalyticsPage() {
  const { auth } = useMonorepoApp();
  const router = useRouter();

  const [activeTab, setActiveTab]     = useState<ServiceTab>('transporte');
  const [serviceStats, setServiceStats] = useState<Record<ServiceTab,ServiceStats>>({} as any);
  const [daily,   setDaily]   = useState<DailyStat[]>([]);
  const [routes,  setRoutes]  = useState<RouteRank[]>([]);
  const [cities,  setCities]  = useState<CityRank[]>([]);
  const [funnel,  setFunnel]  = useState<{label:string;value:number;color:string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken') ?? '';

      /* ── Transport ── */
      const [tStats, tDaily, tRoutes, tCities] = await Promise.all([
        safeGet<any>(token, '/admin/stats/transport'),
        safeGet<DailyStat[]>(token, '/admin/stats/transport/daily?days=7'),
        safeGet<RouteRank[]>(token, '/admin/stats/transport/routes?limit=5'),
        safeGet<CityRank[]>(token, '/admin/stats/transport/cities'),
      ]);

      if (tDaily && Array.isArray(tDaily)) setDaily(tDaily);
      if (tRoutes && Array.isArray(tRoutes)) setRoutes(tRoutes);
      if (tCities && Array.isArray(tCities)) setCities(tCities);

      /* ── Other services ── */
      const serviceData: Record<ServiceTab, ServiceStats> = {} as any;
      TABS.forEach(t => { serviceData[t.key] = emptyStats(t.key); });

      if (tStats) {
        serviceData.transporte = {
          ...emptyStats('transporte'),
          total:          tStats.totalTrips    ?? 0,
          revenue:        tStats.totalRevenue  ?? 0,
          active:         tStats.activeDrivers ?? 0,
          avgRating:      tStats.avgRating     ?? 0,
          completionRate: tStats.completionRate ?? 0,
          vsLastWeek:     tStats.vsLastWeek
            ? {volume:tStats.vsLastWeek.trips??0, revenue:tStats.vsLastWeek.revenue??0}
            : {volume:0,revenue:0},
          isReal: true,
        };
      }

      for (const [svcKey, eps] of Object.entries(SERVICE_ENDPOINTS) as [ServiceTab,{list:string;stats:string}][]) {
        const [svcStats, count] = await Promise.all([
          safeGet<any>(token, eps.stats),
          safeCount(token, eps.list),
        ]);
        if (svcStats) {
          serviceData[svcKey] = {
            ...emptyStats(svcKey),
            total:          svcStats.total ?? svcStats.count ?? count,
            revenue:        svcStats.totalRevenue ?? svcStats.revenue ?? emptyStats(svcKey).revenue,
            active:         svcStats.active ?? svcStats.activeProviders ?? emptyStats(svcKey).active,
            avgRating:      svcStats.avgRating ?? emptyStats(svcKey).avgRating,
            completionRate: svcStats.completionRate ?? emptyStats(svcKey).completionRate,
            vsLastWeek:     svcStats.vsLastWeek ?? {volume:0,revenue:0},
            isReal: true,
          };
        } else if (count > 0) {
          serviceData[svcKey] = { ...emptyStats(svcKey), total: count };
        }
      }

      setServiceStats(serviceData);

      /* ── Funnel ── */
      const [usersTotal, bookingsTotal, paymentsPaid, usersRepeat] = await Promise.all([
        safeCount(token, '/auth/admin/users?limit=1'),
        safeCount(token, '/bookings?limit=1'),
        safeCount(token, '/payments?status=paid&limit=1'),
        safeGet<any>(token, '/admin/stats/retention'),
      ]);
      const repeatCount = usersRepeat?.repeatUsers ?? usersRepeat?.retention ?? 0;
      setFunnel([
        {label:'Usuarios registrados',   value: usersTotal,    color:'#0033A0'},
        {label:'Reservas creadas',        value: bookingsTotal, color:'#f59e0b'},
        {label:'Pagos completados',       value: paymentsPaid,  color:'#16a34a'},
        {label:'Usuarios que repiten',    value: repeatCount,   color:'#ff4c41'},
      ]);

    } catch {
      const fallback = {} as Record<ServiceTab,ServiceStats>;
      TABS.forEach(t => { fallback[t.key] = emptyStats(t.key); });
      setServiceStats(fallback);
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

  if (auth.isLoading || loading) return <Loading fullHeight size="lg" message="Cargando métricas..." />;
  if (!auth.user?.isAdmin?.()) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <ErrorState title="Acceso Denegado" description="Se requiere rol de administrador."
        action={<Button onClick={() => router.push('/')}>Volver</Button>} />
    </div>
  );

  const tab = TABS.find(t => t.key === activeTab)!;
  const sv  = serviceStats[activeTab] ?? emptyStats(activeTab);
  const kpi = KPI_LABELS[activeTab];

  const allServices = TABS.filter(t => t.key !== 'global').map(t => {
    const s = serviceStats[t.key] ?? emptyStats(t.key);
    return { label:t.label, icon:t.icon, color:t.color, ops:s.total, revenue:s.revenue };
  });
  const globalRevenue = allServices.reduce((s,x) => s+x.revenue, 0);
  const globalOps     = allServices.reduce((s,x) => s+x.ops, 0);

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
            }`}>
            <span>{t.icon}</span><span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── GLOBAL TAB ── */}
      {activeTab === 'global' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <StatCard icon="💰" title="Ingresos Totales"  value={`$${globalRevenue.toLocaleString()}`} subtitle="todos los servicios" color="success" />
            <StatCard icon="📊" title="Operaciones"       value={globalOps.toLocaleString()} subtitle="viajes + envíos + reservas" color="primary" />
            <StatCard icon="🏢" title="Comisión Going App"    value={`$${(globalRevenue*0.20).toLocaleString()}`} subtitle="20% promedio" color="info" />
          </div>

          {/* Funnel */}
          <FunnelSection funnel={funnel} />

          {/* Revenue by service */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-5">💵 Ingresos por servicio</h3>
            <div className="space-y-4">
              {allServices.sort((a,b) => b.revenue-a.revenue).map(s => {
                const share = globalRevenue > 0 ? (s.revenue/globalRevenue)*100 : 0;
                return (
                  <div key={s.label}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm font-semibold text-gray-800">{s.icon} {s.label}</span>
                      <div className="text-right">
                        <span className="text-sm font-bold text-gray-900">${s.revenue.toLocaleString()}</span>
                        <span className="text-xs text-gray-400 ml-2">{share.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div className="h-2.5 rounded-full" style={{width:`${share}%`, backgroundColor:s.color}} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ops by service */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-5">📈 Operaciones por servicio</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
              {allServices.map(s => (
                <div key={s.label} className="text-center p-4 rounded-xl border border-gray-100 bg-gray-50">
                  <div className="text-3xl mb-1">{s.icon}</div>
                  <p className="text-xl font-black" style={{color:s.color}}>{s.ops.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── SERVICE TABS (non-global) ── */}
      {activeTab !== 'global' && (
        <>
          <div className="flex items-center gap-3 mb-5">
            <h2 className="text-xl font-bold" style={{color:tab.color}}>{tab.icon} {tab.label}</h2>
            <DataBadge isReal={sv.isReal} />
          </div>

          {/* KPI Cards */}
          <KpiGrid sv={sv} kpi={kpi} />

          {/* Financial breakdown for this service */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-base font-bold text-gray-900 mb-4">💵 Desglose financiero</h3>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-50">
                  {[
                    {label:'Ingresos brutos',     value:`$${sv.revenue.toLocaleString('es',{minimumFractionDigits:2})}`, color:'text-gray-900'},
                    {label:'Comisión Going App (20%)', value:`$${(sv.revenue*0.20).toLocaleString('es',{minimumFractionDigits:2})}`, color:'text-red-600'},
                    {label:'Neto proveedores',     value:`$${(sv.revenue*0.80).toLocaleString('es',{minimumFractionDigits:2})}`, color:'text-green-700'},
                    {label:'Ticket promedio',      value:`$${sv.total>0?(sv.revenue/sv.total).toFixed(2):'0.00'}`, color:'text-gray-700'},
                  ].map(row => (
                    <tr key={row.label}>
                      <td className="py-2.5 text-gray-600">{row.label}</td>
                      <td className={`py-2.5 text-right font-bold ${row.color}`}>{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-base font-bold text-gray-900 mb-4">📊 Métricas de calidad</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Tasa de completación</span>
                    <span className="font-bold" style={{color:sv.completionRate>=95?'#22c55e':sv.completionRate>=85?'#f59e0b':'#ef4444'}}>{sv.completionRate}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="h-2 rounded-full" style={{width:`${sv.completionRate}%`, backgroundColor:tab.color}} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Rating promedio</span>
                    <span className="font-bold text-amber-600">⭐ {sv.avgRating} / 5.0</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="h-2 rounded-full bg-amber-400" style={{width:`${(sv.avgRating/5)*100}%`}} />
                  </div>
                </div>
                <div className="pt-2 grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-500">vs sem. anterior (volumen)</p>
                    <p className="text-lg font-black mt-0.5" style={{color:sv.vsLastWeek.volume>=0?'#22c55e':'#ef4444'}}>{pct(sv.vsLastWeek.volume)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-500">vs sem. anterior (ingresos)</p>
                    <p className="text-lg font-black mt-0.5" style={{color:sv.vsLastWeek.revenue>=0?'#22c55e':'#ef4444'}}>{pct(sv.vsLastWeek.revenue)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Transport-specific charts */}
          {activeTab === 'transporte' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="md:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h3 className="text-base font-bold text-gray-900 mb-4">📅 Viajes últimos 7 días</h3>
                <BarChart data={daily} color={tab.color} valueKey="trips"
                  labelFn={(d) => new Date(d.date+'T12:00:00').toLocaleDateString('es',{weekday:'short'})} />
                <div className="flex justify-between mt-3 text-xs text-gray-400">
                  <span>Total: {daily.reduce((s,d)=>s+d.trips,0).toLocaleString()} viajes</span>
                  <span>Ingresos: ${daily.reduce((s,d)=>s+d.revenue,0).toLocaleString()}</span>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h3 className="text-base font-bold text-gray-900 mb-4">🏙️ Ciudades top</h3>
                <HBar items={cities.map(c=>({label:c.city, value:c.trips, sub:`${c.active_drivers} conductores`}))} color={tab.color} />
              </div>
            </div>
          )}

          {activeTab === 'transporte' && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-6">
              <h3 className="text-base font-bold text-gray-900 mb-4">🗺️ Rutas más demandadas</h3>
              <HBar items={routes.map(r=>({label:r.route, value:r.trips, sub:`$${r.revenue.toLocaleString()}`}))} color={tab.color} />
            </div>
          )}

          {/* Non-transport: provider listing summary */}
          {activeTab !== 'transporte' && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-6">
              <h3 className="text-base font-bold text-gray-900 mb-4">📋 Resumen operativo</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <p className="text-3xl font-black" style={{color:tab.color}}>{sv.total.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-1">{kpi.unit} en plataforma</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <p className="text-3xl font-black text-gray-900">{sv.active}</p>
                  <p className="text-xs text-gray-500 mt-1">{kpi.active.toLowerCase()}</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <p className="text-3xl font-black text-amber-500">⭐ {sv.avgRating}</p>
                  <p className="text-xs text-gray-500 mt-1">rating promedio</p>
                </div>
              </div>
              {!sv.isReal && (
                <p className="text-xs text-amber-600 mt-4 text-center">
                  ⚠ Estos datos son estimados. Conecta el endpoint <code>/admin/stats/{activeTab}</code> para datos reales.
                </p>
              )}
            </div>
          )}
        </>
      )}

      <div className="mt-4">
        <Button variant="ghost" onClick={() => router.push('/')}>← Volver al Dashboard</Button>
      </div>

    </AdminLayout>
  );
}
