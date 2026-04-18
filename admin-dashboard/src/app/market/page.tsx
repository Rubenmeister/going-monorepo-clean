'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';
import { AdminLayout } from '../components';
import { API } from '../../lib/admin-api';

/* ─── Types ─────────────────────────────────────────────────────────── */
interface CityMarket {
  city:           string;
  province:       string;
  trips:          number;
  activeDrivers:  number;
  demand:         number;   // trips / drivers ratio
  trend:          number;   // % change vs last week (demo)
  services:       string[]; // which services operate here
}

interface HourSlot { hour: number; volume: number; }
interface DaySlot  { day: string;  volume: number; }
interface UserGrowth { month: string; users: number; drivers: number; }

/* ─── Demo data ──────────────────────────────────────────────────────── */
const DEMO_HOURS: HourSlot[] = [
  { hour: 0, volume: 12 }, { hour: 1, volume: 8  }, { hour: 2, volume: 5  }, { hour: 3, volume: 3  },
  { hour: 4, volume: 7  }, { hour: 5, volume: 18 }, { hour: 6, volume: 45 }, { hour: 7, volume: 82 },
  { hour: 8, volume: 96 }, { hour: 9, volume: 74 }, { hour: 10, volume: 58 }, { hour: 11, volume: 62 },
  { hour: 12, volume: 78 }, { hour: 13, volume: 85 }, { hour: 14, volume: 70 }, { hour: 15, volume: 65 },
  { hour: 16, volume: 72 }, { hour: 17, volume: 90 }, { hour: 18, volume: 100 }, { hour: 19, volume: 88 },
  { hour: 20, volume: 68 }, { hour: 21, volume: 52 }, { hour: 22, volume: 38 }, { hour: 23, volume: 22 },
];

const DEMO_DAYS: DaySlot[] = [
  { day: 'Lun', volume: 72 }, { day: 'Mar', volume: 68 }, { day: 'Mié', volume: 71 },
  { day: 'Jue', volume: 75 }, { day: 'Vie', volume: 92 }, { day: 'Sáb', volume: 100 }, { day: 'Dom', volume: 58 },
];

const DEMO_GROWTH: UserGrowth[] = [
  { month: 'Oct',  users: 1820, drivers: 48 },
  { month: 'Nov',  users: 2140, drivers: 55 },
  { month: 'Dic',  users: 2380, drivers: 61 },
  { month: 'Ene',  users: 2590, drivers: 67 },
  { month: 'Feb',  users: 2810, drivers: 72 },
  { month: 'Mar',  users: 3050, drivers: 78 },
  { month: 'Abr',  users: 3210, drivers: 84 },
];

const DEMO_CITIES: CityMarket[] = [
  { city: 'Quito',          province: 'Pichincha',   trips: 680,  activeDrivers: 28, demand: 24.3, trend: 12,  services: ['transporte', 'envios', 'tours'] },
  { city: 'Guayaquil',      province: 'Guayas',      trips: 410,  activeDrivers: 18, demand: 22.8, trend: 8,   services: ['transporte', 'envios'] },
  { city: 'Santo Domingo',  province: 'Sto. Domingo', trips: 320, activeDrivers: 14, demand: 22.9, trend: 15,  services: ['transporte', 'envios'] },
  { city: 'Cuenca',         province: 'Azuay',       trips: 210,  activeDrivers: 10, demand: 21.0, trend: 6,   services: ['transporte', 'tours', 'alojamientos'] },
  { city: 'Ambato',         province: 'Tungurahua',  trips: 190,  activeDrivers: 9,  demand: 21.1, trend: 9,   services: ['transporte', 'experiencias'] },
  { city: 'Ibarra',         province: 'Imbabura',    trips: 155,  activeDrivers: 8,  demand: 19.4, trend: 18,  services: ['transporte', 'tours'] },
  { city: 'Loja',           province: 'Loja',        trips: 98,   activeDrivers: 5,  demand: 19.6, trend: 22,  services: ['transporte'] },
  { city: 'Riobamba',       province: 'Chimborazo',  trips: 88,   activeDrivers: 4,  demand: 22.0, trend: 11,  services: ['transporte', 'tours'] },
  { city: 'Baños',          province: 'Tungurahua',  trips: 74,   activeDrivers: 3,  demand: 24.7, trend: 28,  services: ['experiencias', 'tours'] },
  { city: 'Montañita',      province: 'Santa Elena', trips: 52,   activeDrivers: 2,  demand: 26.0, trend: 35,  services: ['experiencias', 'alojamientos'] },
];

const SERVICE_ICONS: Record<string, string> = {
  transporte:   '🚗',
  envios:       '📦',
  tours:        '🗺️',
  experiencias: '🎭',
  alojamientos: '🏨',
};

/* ─── Helpers ────────────────────────────────────────────────────────── */
function demandColor(d: number): string {
  if (d >= 25) return '#ef4444';
  if (d >= 22) return '#f59e0b';
  return '#22c55e';
}
function demandLabel(d: number): string {
  if (d >= 25) return 'Alta';
  if (d >= 22) return 'Media';
  return 'Normal';
}
function trendColor(t: number): string {
  return t >= 0 ? '#22c55e' : '#ef4444';
}

/* ─── Tiny bar chart inline ──────────────────────────────────────────── */
function MiniBar({ value, max, color, label }: { value: number; max: number; color: string; label?: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="w-full flex flex-col justify-end" style={{ height: 64 }}>
        <div className="w-full rounded-t" style={{ height: `${Math.max((value / max) * 64, 3)}px`, backgroundColor: color }} />
      </div>
      {label && <span className="text-[8px] text-gray-400">{label}</span>}
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────── */
export default function MarketPage() {
  const { auth, domain } = useMonorepoApp();
  const router           = useRouter();

  const [cities,    setCities]    = useState<CityMarket[]>(DEMO_CITIES);
  const [hours,     setHours]     = useState<HourSlot[]>(DEMO_HOURS);
  const [days,      setDays]      = useState<DaySlot[]>(DEMO_DAYS);
  const [growth,    setGrowth]    = useState<UserGrowth[]>(DEMO_GROWTH);
  const [loading,   setLoading]   = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [sortBy,    setSortBy]    = useState<'trips' | 'demand' | 'trend'>('trips');
  const [filterSvc, setFilterSvc] = useState<string>('all');

  useEffect(() => {
    if (!auth.isLoading && !auth.user) router.push('/login');
  }, [auth.isLoading, auth.user, router]);

  const load = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('authToken') ?? '';
    try {
      /* Real: cities from transport stats */
      const citiesRes = await fetch(`${API}/admin/stats/transport/cities`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.ok ? r.json() : null).catch(() => null);

      if (Array.isArray(citiesRes) && citiesRes.length > 0) {
        /* Merge real data into demo cities */
        const merged = DEMO_CITIES.map(dc => {
          const real = citiesRes.find((rc: any) => rc.city?.toLowerCase() === dc.city.toLowerCase());
          return real
            ? { ...dc, trips: real.trips ?? dc.trips, activeDrivers: real.active_drivers ?? dc.activeDrivers }
            : dc;
        });
        /* Add cities from real data not in demo */
        citiesRes.forEach((rc: any) => {
          if (!merged.find(m => m.city.toLowerCase() === rc.city?.toLowerCase())) {
            merged.push({
              city: rc.city, province: '—', trips: rc.trips ?? 0,
              activeDrivers: rc.active_drivers ?? 0,
              demand: rc.active_drivers > 0 ? (rc.trips / rc.active_drivers) : 0,
              trend: 0, services: ['transporte'],
            });
          }
        });
        setCities(merged);
      }

      /* Real: user + driver counts for growth (single point) */
      const statsRes = await domain.admin.getStats();
      if (statsRes?.total) {
        setGrowth(prev => {
          const last = [...prev];
          last[last.length - 1] = { ...last[last.length - 1], users: statsRes.total, drivers: statsRes.drivers ?? last[last.length - 1].drivers };
          return last;
        });
      }

    } catch { /* fallback demo */ }
    finally { setLoading(false); setLastUpdated(new Date()); }
  }, [domain.admin]);

  useEffect(() => { if (auth.user) load(); }, [auth.user, load]);

  /* Derived */
  const sorted = [...cities]
    .filter(c => filterSvc === 'all' || c.services.includes(filterSvc))
    .sort((a, b) =>
      sortBy === 'trips'  ? b.trips  - a.trips  :
      sortBy === 'demand' ? b.demand - a.demand  :
                            b.trend  - a.trend
    );

  const maxTrips  = Math.max(...cities.map(c => c.trips), 1);
  const maxHour   = Math.max(...hours.map(h => h.volume), 1);
  const maxDay    = Math.max(...days.map(d => d.volume), 1);
  const maxUsers  = Math.max(...growth.map(g => g.users), 1);

  const peakHour  = hours.reduce((best, h) => h.volume > best.volume ? h : best, hours[0]);
  const peakDay   = days.reduce((best, d) => d.volume > best.volume ? d : best, days[0]);
  const avgDemand = cities.length > 0 ? (cities.reduce((s, c) => s + c.demand, 0) / cities.length) : 0;
  const highGrowthCities = cities.filter(c => c.trend >= 20);

  return (
    <AdminLayout userName={auth.user?.firstName ?? 'Admin'} onLogout={auth.logout}>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Estadísticas de Mercado</h1>
          <p className="text-gray-500 text-sm">Demanda · Horarios · Crecimiento · Expansión — Actualizado: {lastUpdated.toLocaleTimeString('es-EC')}</p>
        </div>
        <button onClick={load}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm">
          🔄 Actualizar
        </button>
      </div>

      {/* ── KPI Summary ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { icon: '🏙️', label: 'Ciudades activas',    value: cities.length,                  sub: `${cities.filter(c=>c.activeDrivers>0).length} con conductores` },
          { icon: '⏰', label: 'Hora pico',            value: `${peakHour?.hour}:00`,         sub: `${peakHour?.volume}% del volumen diario`                         },
          { icon: '📅', label: 'Día más activo',       value: peakDay?.day ?? '—',            sub: 'mayor volumen de viajes'                                         },
          { icon: '🔥', label: 'Ciudades en auge',     value: highGrowthCities.length,        sub: '+20% crecimiento semanal'                                        },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{k.icon}</span>
              <p className="text-xs text-gray-500">{k.label}</p>
            </div>
            <p className="text-2xl font-black text-gray-900">{k.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Demand heatmap by hour ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">⏰ Demanda por hora del día</h3>
            <span className="text-xs bg-red-50 text-red-600 font-bold px-2 py-1 rounded-lg">Pico: {peakHour?.hour}:00h</span>
          </div>
          <div className="flex items-end gap-1" style={{ height: 72 }}>
            {hours.map(h => {
              const isPeak = h.volume === maxHour;
              return (
                <div key={h.hour} className="flex-1 flex flex-col items-center gap-0.5">
                  <div className="w-full flex flex-col justify-end" style={{ height: 64 }}>
                    <div className="w-full rounded-t transition-all"
                      style={{ height: `${Math.max((h.volume / maxHour) * 64, 2)}px`, backgroundColor: isPeak ? '#ff4c41' : '#0033A0', opacity: 0.3 + (h.volume / maxHour) * 0.7 }} />
                  </div>
                  {h.hour % 4 === 0 && <span className="text-[7px] text-gray-400">{h.hour}h</span>}
                </div>
              );
            })}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
            {[
              { label: 'Madrugada (0-5h)',  pct: Math.round(hours.slice(0,6).reduce((s,h)=>s+h.volume,0)/hours.reduce((s,h)=>s+h.volume,0)*100), color: '#6366f1' },
              { label: 'Mañana (6-12h)',    pct: Math.round(hours.slice(6,13).reduce((s,h)=>s+h.volume,0)/hours.reduce((s,h)=>s+h.volume,0)*100), color: '#0033A0' },
              { label: 'Tarde/noche (13h+)',pct: Math.round(hours.slice(13).reduce((s,h)=>s+h.volume,0)/hours.reduce((s,h)=>s+h.volume,0)*100), color: '#ff4c41' },
            ].map(p => (
              <div key={p.label} className="text-center bg-gray-50 rounded-lg p-2">
                <p className="font-black text-lg" style={{ color: p.color }}>{p.pct}%</p>
                <p className="text-gray-400 text-[9px] leading-tight">{p.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">📅 Demanda por día de la semana</h3>
            <span className="text-xs bg-orange-50 text-orange-600 font-bold px-2 py-1 rounded-lg">Pico: {peakDay?.day}</span>
          </div>
          <div className="flex items-end gap-2" style={{ height: 100 }}>
            {days.map(d => {
              const isPeak = d.volume === maxDay;
              return (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] font-bold text-gray-600">{d.volume}%</span>
                  <div className="w-full flex flex-col justify-end" style={{ height: 72 }}>
                    <div className="w-full rounded-t transition-all"
                      style={{ height: `${Math.max((d.volume / maxDay) * 72, 3)}px`, backgroundColor: isPeak ? '#ff4c41' : '#0033A0', opacity: 0.4 + (d.volume / maxDay) * 0.6 }} />
                  </div>
                  <span className={`text-[10px] font-semibold ${isPeak ? 'text-[#ff4c41] font-black' : 'text-gray-400'}`}>{d.day}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── User & driver growth ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900">📈 Crecimiento de usuarios y conductores</h3>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1"><span className="w-3 h-1 bg-[#0033A0] rounded-full inline-block" /> Usuarios</span>
            <span className="flex items-center gap-1"><span className="w-3 h-1 bg-[#ff4c41] rounded-full inline-block" /> Conductores</span>
          </div>
        </div>
        <div className="flex items-end gap-3" style={{ height: 100 }}>
          {growth.map((g, i) => {
            const isLast = i === growth.length - 1;
            return (
              <div key={g.month} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end gap-0.5" style={{ height: 80 }}>
                  <div className="flex-1 rounded-t transition-all"
                    style={{ height: `${Math.max((g.users / maxUsers) * 80, 4)}px`, backgroundColor: '#0033A0', opacity: isLast ? 1 : 0.5 + (i / growth.length) * 0.4 }} />
                  <div className="flex-1 rounded-t transition-all"
                    style={{ height: `${Math.max((g.drivers / 100) * 80, 4)}px`, backgroundColor: '#ff4c41', opacity: isLast ? 1 : 0.5 + (i / growth.length) * 0.4 }} />
                </div>
                <span className={`text-[10px] font-semibold ${isLast ? 'text-gray-700 font-black' : 'text-gray-400'}`}>{g.month}</span>
              </div>
            );
          })}
        </div>
        <div className="flex gap-6 mt-3 text-sm">
          <div>
            <span className="text-xs text-gray-400">Usuarios totales</span>
            <p className="font-black text-lg text-[#0033A0]">{growth[growth.length-1]?.users.toLocaleString()}</p>
          </div>
          <div>
            <span className="text-xs text-gray-400">Conductores activos</span>
            <p className="font-black text-lg text-[#ff4c41]">{growth[growth.length-1]?.drivers}</p>
          </div>
          <div>
            <span className="text-xs text-gray-400">Ratio usuarios/conductor</span>
            <p className="font-black text-lg text-gray-700">
              {growth[growth.length-1]?.drivers > 0
                ? (growth[growth.length-1].users / growth[growth.length-1].drivers).toFixed(0)
                : '—'}:1
            </p>
          </div>
        </div>
      </div>

      {/* ── City market table ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-5">
        <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
          <h3 className="font-bold text-gray-900 flex-1">🏙️ Análisis por ciudad</h3>
          <select value={filterSvc} onChange={e => setFilterSvc(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none">
            <option value="all">Todos los servicios</option>
            {Object.keys(SERVICE_ICONS).map(s => <option key={s} value={s}>{SERVICE_ICONS[s]} {s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          <div className="flex gap-1">
            {(['trips', 'demand', 'trend'] as const).map(s => (
              <button key={s} onClick={() => setSortBy(s)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${sortBy === s ? 'text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                style={sortBy === s ? { backgroundColor: '#0033A0' } : undefined}>
                {s === 'trips' ? 'Viajes' : s === 'demand' ? 'Demanda' : 'Crecim.'}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Ciudad', 'Provincia', 'Viajes', 'Conductores', 'Ratio', 'Demanda', 'Crecim.', 'Servicios'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((c, i) => (
                <tr key={c.city} className={`border-t border-gray-50 ${i === 0 ? 'bg-yellow-50/30' : 'hover:bg-gray-50'} transition-colors`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {i === 0 && <span className="text-yellow-500 text-xs">👑</span>}
                      <span className="font-semibold text-gray-900">{c.city}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{c.province}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-100 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-[#0033A0]" style={{ width: `${(c.trips / maxTrips) * 100}%` }} />
                      </div>
                      <span className="font-bold text-gray-900">{c.trips}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-700">{c.activeDrivers}</td>
                  <td className="px-4 py-3 text-gray-500">{c.activeDrivers > 0 ? (c.trips / c.activeDrivers).toFixed(1) : '—'}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: demandColor(c.demand) + '20', color: demandColor(c.demand) }}>
                      {demandLabel(c.demand)} ({c.demand.toFixed(1)})
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold" style={{ color: trendColor(c.trend) }}>
                    {c.trend >= 0 ? '+' : ''}{c.trend}%
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {c.services.map(s => (
                        <span key={s} title={s} className="text-base">{SERVICE_ICONS[s]}</span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Expansion opportunities ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-gray-900 mb-4">🚀 Oportunidades de expansión</h3>
          <div className="space-y-3">
            {highGrowthCities.map(c => (
              <div key={c.city} className="flex items-center justify-between bg-green-50 rounded-xl px-4 py-3">
                <div>
                  <p className="font-bold text-sm text-gray-900">{c.city}</p>
                  <p className="text-xs text-gray-500">Demanda: {demandLabel(c.demand)} · {c.services.map(s => SERVICE_ICONS[s]).join(' ')}</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-green-600">+{c.trend}%</p>
                  <p className="text-xs text-gray-400">{c.trips} viajes/sem.</p>
                </div>
              </div>
            ))}
            {highGrowthCities.length === 0 && (
              <p className="text-sm text-gray-400 py-4 text-center">Sin ciudades con alto crecimiento esta semana.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-gray-900 mb-4">⚠️ Zonas con demanda insatisfecha</h3>
          <p className="text-xs text-gray-400 mb-3">Ratio viajes/conductor {'>'}24 indica falta de oferta</p>
          <div className="space-y-3">
            {[...cities].filter(c => c.demand >= 24).sort((a,b) => b.demand - a.demand).slice(0,5).map(c => (
              <div key={c.city} className="flex items-center justify-between bg-red-50 rounded-xl px-4 py-3">
                <div>
                  <p className="font-bold text-sm text-gray-900">{c.city}</p>
                  <p className="text-xs text-gray-500">{c.activeDrivers} conductores · {c.trips} viajes</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-red-600">{c.demand.toFixed(1)}x</p>
                  <p className="text-xs text-gray-400">viajes/conductor</p>
                </div>
              </div>
            ))}
            {cities.filter(c => c.demand >= 24).length === 0 && (
              <p className="text-sm text-gray-400 py-4 text-center">Oferta y demanda equilibradas.</p>
            )}
          </div>
        </div>
      </div>

      {/* Data source note */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4 text-xs text-blue-700 flex items-start gap-3">
        <span className="text-lg flex-shrink-0">💡</span>
        <div>
          <p className="font-bold mb-1">Fuentes de datos</p>
          <p>Ciudades y viajes: <code>/admin/stats/transport/cities</code> (real). Usuarios/conductores: <code>/auth/admin/stats</code> (real). Horarios y crecimiento histórico: proyecciones demo — estarán disponibles cuando el backend exponga <code>/admin/stats/market/hours</code> y <code>/admin/stats/growth/monthly</code>.</p>
        </div>
      </div>

    </AdminLayout>
  );
}
