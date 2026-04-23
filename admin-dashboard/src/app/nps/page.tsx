'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';
import { AdminLayout } from '../components';
import { Loading } from '@going-monorepo-clean/shared-ui';
import { API } from '../../lib/admin-api';

interface NPSResponse {
  id: string; bookingId: string; userId: string; userName: string;
  serviceType: string; driverId?: string; driverName?: string;
  score: number; comment?: string; createdAt: string;
}

async function safeGet<T>(token: string, path: string): Promise<T | null> {
  try {
    const r = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
    return r.ok ? r.json() : null;
  } catch { return null; }
}

const SERVICE_LABELS: Record<string,string> = {
  transport:'Transporte', tour:'Tours', experience:'Experiencias',
  accommodation:'Alojamiento', parcel:'Encomiendas',
};

function scoreLabel(s: number): 'promoter' | 'neutral' | 'detractor' {
  if (s >= 9) return 'promoter';
  if (s >= 7) return 'neutral';
  return 'detractor';
}

function calcNPS(responses: NPSResponse[]) {
  if (!responses.length) return 0;
  const p = responses.filter(r => r.score >= 9).length;
  const d = responses.filter(r => r.score <= 6).length;
  return Math.round((p - d) / responses.length * 100);
}

function timeAgo(iso: string) {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3600000);
  if (h < 1) return 'hace <1h';
  if (h < 24) return `hace ${h}h`;
  return `hace ${Math.floor(h/24)}d`;
}

/** Agrupa responses por mes y calcula NPS mensual */
function computeMonthlyTrend(responses: NPSResponse[]) {
  const map = new Map<string, NPSResponse[]>();
  responses.forEach(r => {
    const d = new Date(r.createdAt);
    const key = d.toLocaleString('es-EC', { month: 'short', timeZone: 'America/Guayaquil' });
    const arr = map.get(key) ?? [];
    arr.push(r);
    map.set(key, arr);
  });
  return Array.from(map.entries())
    .map(([month, rs]) => ({ month, score: calcNPS(rs), responses: rs.length }))
    .slice(-6); // últimos 6 meses
}

export default function NPSPage() {
  const { auth } = useMonorepoApp();
  const token: string = typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? '' : '';

  const [responses,   setResponses]   = useState<NPSResponse[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState<'all' | 'promoter' | 'neutral' | 'detractor'>('all');
  const [serviceFilter, setServiceFilter] = useState('all');

  const fetchData = useCallback(async () => {
    setLoading(true);
    const data = await safeGet<any>(token, '/nps/responses?limit=200');
    const raw: any[] = Array.isArray(data) ? data : data?.data ?? data?.items ?? [];
    setResponses(raw);
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (auth.isLoading || loading) return <Loading fullHeight size="lg" message="Cargando NPS…" />;

  const nps         = calcNPS(responses);
  const promoters   = responses.filter(r => r.score >= 9);
  const neutrals    = responses.filter(r => r.score >= 7 && r.score <= 8);
  const detractors  = responses.filter(r => r.score <= 6);

  const npsColor = nps >= 50 ? '#16a34a' : nps >= 20 ? '#f59e0b' : '#dc2626';
  const npsLabel = nps >= 50 ? 'Excelente' : nps >= 20 ? 'Bueno' : nps >= 0 ? 'Regular' : 'Crítico';

  const monthlyTrend = computeMonthlyTrend(responses);

  // By service
  const byService = Object.entries(SERVICE_LABELS).map(([k, label]) => {
    const svc = responses.filter(r => r.serviceType === k);
    return { key: k, label, count: svc.length, nps: calcNPS(svc) };
  }).filter(s => s.count > 0).sort((a,b) => b.nps - a.nps);

  // By driver (top rated)
  const driverMap = new Map<string, NPSResponse[]>();
  responses.forEach(r => {
    if (!r.driverName) return;
    const arr = driverMap.get(r.driverName) ?? [];
    arr.push(r); driverMap.set(r.driverName, arr);
  });
  const byDriver = Array.from(driverMap.entries())
    .filter(([,r]) => r.length >= 2)
    .map(([name, r]) => ({ name, count: r.length, nps: calcNPS(r), avg: +(r.reduce((s,x) => s+x.score,0)/r.length).toFixed(1) }))
    .sort((a,b) => b.nps - a.nps);

  const withComments = responses.filter(r => r.comment);
  const filtered = responses
    .filter(r => filter === 'all' || scoreLabel(r.score) === filter)
    .filter(r => serviceFilter === 'all' || r.serviceType === serviceFilter);

  return (
    <AdminLayout userName={auth.user?.firstName ?? 'Admin'} onLogout={auth.logout}>

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">NPS — Satisfacción del Cliente</h1>
          <p className="text-sm text-gray-500 mt-1">Encuesta automática 10 min después de cada viaje · {responses.length} respuestas</p>
        </div>
        <button onClick={fetchData} className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">↺ Refrescar</button>
      </div>

      {/* Hero NPS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="md:col-span-1 rounded-2xl border p-6 text-center shadow-sm"
          style={{ backgroundColor: npsColor + '12', borderColor: npsColor + '40' }}>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Score NPS</p>
          <p className="text-6xl font-black" style={{ color: npsColor }}>{responses.length ? nps : '—'}</p>
          <p className="text-sm font-semibold mt-1" style={{ color: npsColor }}>{responses.length ? npsLabel : 'Sin datos'}</p>
          <p className="text-xs text-gray-400 mt-2">–100 a +100 · industria avg: +32</p>
        </div>
        {[
          { label:'Promotores', count:promoters.length, pct: responses.length ? Math.round(promoters.length/responses.length*100) : 0, color:'#16a34a', sub:'Score 9-10', key:'promoter' as const },
          { label:'Neutros',    count:neutrals.length,  pct: responses.length ? Math.round(neutrals.length/responses.length*100)  : 0, color:'#f59e0b', sub:'Score 7-8',  key:'neutral' as const },
          { label:'Detractores',count:detractors.length,pct: responses.length ? Math.round(detractors.length/responses.length*100) : 0, color:'#dc2626', sub:'Score 0-6',  key:'detractor' as const },
        ].map(g => (
          <button key={g.key} onClick={() => setFilter(filter === g.key ? 'all' : g.key)}
            className={`rounded-2xl border p-5 text-left shadow-sm transition-all hover:shadow-md ${filter === g.key ? 'ring-2' : ''}`}
            style={{ borderColor: filter === g.key ? g.color : '#f3f4f6', '--tw-ring-color': g.color } as any}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{g.label}</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: g.color }}>{g.pct}%</span>
            </div>
            <p className="text-3xl font-black" style={{ color: g.color }}>{g.count}</p>
            <p className="text-xs text-gray-400 mt-1">{g.sub}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">

        {/* Monthly trend — computed from real responses */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-900 mb-4">Tendencia NPS</h2>
          {monthlyTrend.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Sin datos aún</p>
          ) : (
            <div className="space-y-2">
              {monthlyTrend.map((m, i) => {
                const isLast = i === monthlyTrend.length - 1;
                const col = m.score >= 50 ? '#16a34a' : m.score >= 20 ? '#f59e0b' : '#dc2626';
                const pct = ((m.score + 100) / 200) * 100;
                return (
                  <div key={m.month} className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-7">{m.month}</span>
                    <div className="flex-1 h-6 bg-gray-100 rounded-lg overflow-hidden relative">
                      <div className="h-full rounded-lg flex items-center pl-2"
                        style={{ width:`${Math.max(pct, 4)}%`, backgroundColor: isLast ? col : '#cbd5e1' }}>
                        <span className="text-xs font-bold text-white">{m.score >= 0 ? '+' : ''}{m.score}</span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 w-10 text-right">{m.responses}r</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* By service */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-900 mb-4">Por servicio</h2>
          {byService.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Sin datos aún</p>
          ) : (
            <div className="space-y-3">
              {byService.map(s => {
                const col = s.nps >= 50 ? '#16a34a' : s.nps >= 20 ? '#f59e0b' : '#dc2626';
                return (
                  <div key={s.key} className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700 truncate">{s.label}</span>
                        <span className="text-gray-400 flex-shrink-0 ml-2">{s.count} resp.</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width:`${Math.max(5, (s.nps+100)/2)}%`, backgroundColor: col }} />
                      </div>
                    </div>
                    <span className="text-sm font-black flex-shrink-0 w-10 text-right" style={{ color: col }}>
                      {s.nps >= 0 ? '+' : ''}{s.nps}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* By driver */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-900 mb-4">Por conductor</h2>
          {byDriver.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Sin datos aún</p>
          ) : (
            <div className="space-y-2">
              {byDriver.map((d, i) => {
                const col = d.avg >= 8.5 ? '#16a34a' : d.avg >= 7 ? '#f59e0b' : '#dc2626';
                return (
                  <div key={d.name} className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-4">#{i+1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{d.name}</p>
                      <p className="text-xs text-gray-400">{d.count} respuestas</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-black" style={{ color: col }}>{d.avg}</p>
                      <p className="text-xs text-gray-400">NPS {d.nps >= 0 ? '+' : ''}{d.nps}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Verbatims + response list */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Recent comments */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-900 mb-4">Comentarios recientes</h2>
          {withComments.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Sin comentarios aún</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {withComments.slice(0, 10).map(r => {
                const col = r.score >= 9 ? '#16a34a' : r.score >= 7 ? '#f59e0b' : '#dc2626';
                return (
                  <div key={r.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0 text-white"
                      style={{ backgroundColor: col }}>{r.score}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 italic">"{r.comment}"</p>
                      <p className="text-xs text-gray-400 mt-1">{r.userName} · {SERVICE_LABELS[r.serviceType] ?? r.serviceType} · {timeAgo(r.createdAt)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Filtered list */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <h2 className="font-bold text-gray-900 flex-1">Respuestas</h2>
            <select value={serviceFilter} onChange={e => setServiceFilter(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none">
              <option value="all">Todos los servicios</option>
              {Object.entries(SERVICE_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          {filtered.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Sin respuestas aún</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {filtered.slice(0, 20).map(r => {
                const col = r.score >= 9 ? '#16a34a' : r.score >= 7 ? '#f59e0b' : '#dc2626';
                return (
                  <div key={r.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm text-white flex-shrink-0"
                      style={{ backgroundColor: col }}>{r.score}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{r.userName}</p>
                      <p className="text-xs text-gray-400 truncate">{SERVICE_LABELS[r.serviceType] ?? r.serviceType}{r.driverName ? ` · ${r.driverName}` : ''}</p>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">{timeAgo(r.createdAt)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

    </AdminLayout>
  );
}
