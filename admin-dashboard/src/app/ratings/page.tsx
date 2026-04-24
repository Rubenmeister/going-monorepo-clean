'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';
import { AdminLayout } from '../components';
import { Loading } from '@going-monorepo-clean/shared-ui';
import { API } from '../../lib/admin-api';

async function safeGet<T>(token: string, path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
    return res.ok ? res.json() : null;
  } catch { return null; }
}

interface RatingEntry {
  id: string;
  driverId?: string;
  driverName?: string;
  userId?: string;
  bookingId?: string;
  score: number;
  comment?: string;
  category?: string;
  createdAt?: string;
  serviceType?: string;
}

interface DriverRank {
  driverId: string;
  driverName: string;
  avg: number;
  count: number;
  scores: number[];
}

const STAR_COLOR = '#f59e0b';

function StarRow({ count, total, star }: { count: number; total: number; star: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-600 w-8 text-right">{star}★</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2.5">
        <div className="h-2.5 rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500 w-8">{count}</span>
      <span className="text-xs text-gray-400 w-10">({pct.toFixed(0)}%)</span>
    </div>
  );
}

function Stars({ score }: { score: number }) {
  return (
    <span className="text-amber-400">
      {[1,2,3,4,5].map(s => (
        <span key={s} style={{ opacity: score >= s ? 1 : score >= s - 0.5 ? 0.5 : 0.15 }}>★</span>
      ))}
    </span>
  );
}

function AlertBadge({ avg }: { avg: number }) {
  if (avg >= 4.5) return <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold">Excelente</span>;
  if (avg >= 4.0) return <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">Bueno</span>;
  if (avg >= 3.5) return <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-semibold">Regular</span>;
  return <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold">⚠ Bajo</span>;
}

/* Demo fallback data */
function demoRatings(): RatingEntry[] {
  const names = ['Carlos Mendoza','Diana Torres','Luis Pinta','Ana Suárez','Marco Reyes','Valeria Cruz'];
  const comments = ['Excelente servicio','Muy puntual','Coche limpio','Buen trato','Ruta perfecta','Llegó tarde','Sin comentario'];
  return Array.from({ length: 48 }, (_, i) => ({
    id: `r-${i}`,
    driverId: `d-${i % 6}`,
    driverName: names[i % 6],
    bookingId: `b-${i}`,
    score: [5,5,5,4,4,3,2,1][i % 8],
    comment: comments[i % 7],
    serviceType: ['transporte','tours','experiencias'][i % 3],
    createdAt: new Date(Date.now() - i * 86400000 * 2).toISOString(),
  }));
}

export default function RatingsPage() {
  const { auth } = useMonorepoApp();
  const token: string = typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? '' : '';

  const [ratings, setRatings]     = useState<RatingEntry[]>([]);
  const [loading, setLoading]     = useState(true);
  const [isDemo, setIsDemo]       = useState(false);
  const [filterSvc, setFilterSvc] = useState('');
  const [filterScore, setFilterScore] = useState('');
  const [page, setPage]           = useState(0);
  const PAGE_SIZE = 12;

  const load = useCallback(async () => {
    setLoading(true);
    const data = await safeGet<RatingEntry[] | { data?: RatingEntry[]; items?: RatingEntry[] }>(token, '/ratings?limit=200');
    if (data) {
      const list = Array.isArray(data) ? data : (data.data ?? data.items ?? []);
      if (list.length > 0) { setRatings(list); setIsDemo(false); }
      else { setRatings(demoRatings()); setIsDemo(true); }
    } else {
      setRatings(demoRatings()); setIsDemo(true);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const filtered = ratings.filter(r => {
    const matchSvc = !filterSvc || r.serviceType === filterSvc;
    const matchScore = !filterScore || (
      filterScore === 'low'  && r.score <= 3 ||
      filterScore === 'mid'  && r.score === 4 ||
      filterScore === 'high' && r.score === 5
    );
    return matchSvc && matchScore;
  });

  /* Aggregations */
  const total = filtered.length;
  const avg   = total > 0 ? filtered.reduce((s, r) => s + r.score, 0) / total : 0;
  const dist  = [5,4,3,2,1].map(s => ({ star: s, count: filtered.filter(r => r.score === s).length }));

  /* Driver rankings */
  const driverMap = new Map<string, DriverRank>();
  filtered.forEach(r => {
    if (!r.driverId) return;
    const entry = driverMap.get(r.driverId) ?? { driverId: r.driverId, driverName: r.driverName ?? r.driverId, avg: 0, count: 0, scores: [] };
    entry.scores.push(r.score);
    entry.count++;
    entry.avg = entry.scores.reduce((s,v)=>s+v,0) / entry.count;
    driverMap.set(r.driverId, entry);
  });
  const driverRanks = Array.from(driverMap.values()).filter(d => d.count >= 2).sort((a,b) => b.avg - a.avg);
  const topDrivers  = driverRanks.slice(0, 5);
  const lowDrivers  = [...driverRanks].sort((a,b) => a.avg - b.avg).slice(0, 5);

  /* Paginated list */
  const pageData = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  if (auth.isLoading || loading) return <Loading fullHeight size="lg" message="Cargando ratings..." />;

  return (
    <AdminLayout userName={auth.user?.firstName ?? 'Admin'} onLogout={auth.logout}>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Calidad y Ratings</h1>
          <p className="text-sm text-gray-500 mt-1">Satisfacción de usuarios en toda la plataforma</p>
        </div>
        <div className="flex items-center gap-3">
          {isDemo && <span className="text-xs px-3 py-1 bg-amber-100 text-amber-700 rounded-full font-semibold">◐ Datos de ejemplo</span>}
          <button onClick={load} className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
            ↺ Actualizar
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm text-center">
          <p className="text-xs text-gray-500">Rating global</p>
          <p className="text-4xl font-black mt-1" style={{ color: STAR_COLOR }}>{avg.toFixed(2)}</p>
          <Stars score={avg} />
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm text-center">
          <p className="text-xs text-gray-500">Total ratings</p>
          <p className="text-3xl font-black mt-1 text-gray-900">{total.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm text-center">
          <p className="text-xs text-gray-500">Ratings 5★</p>
          <p className="text-3xl font-black mt-1 text-green-600">{dist[0].count}</p>
          <p className="text-xs text-gray-400">{total>0?((dist[0].count/total)*100).toFixed(0):0}%</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm text-center">
          <p className="text-xs text-gray-500">Ratings ≤ 3★ ⚠</p>
          <p className="text-3xl font-black mt-1 text-red-500">{dist[2].count+dist[3].count+dist[4].count}</p>
          <p className="text-xs text-gray-400">{total>0?(((dist[2].count+dist[3].count+dist[4].count)/total)*100).toFixed(0):0}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Distribution */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-base font-bold text-gray-900 mb-4">⭐ Distribución de estrellas</h3>
          <div className="space-y-2.5">
            {dist.map(d => <StarRow key={d.star} star={d.star} count={d.count} total={total} />)}
          </div>
          <div className="mt-5 pt-4 border-t border-gray-100 text-center">
            <p className="text-3xl font-black" style={{ color: STAR_COLOR }}>{avg.toFixed(2)} ★</p>
            <p className="text-xs text-gray-400 mt-1">{total} valoraciones</p>
          </div>
        </div>

        {/* Top drivers */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-base font-bold text-gray-900 mb-4">🏆 Mejores calificados</h3>
          <div className="space-y-3">
            {topDrivers.length === 0 && <p className="text-sm text-gray-400">Sin suficientes datos</p>}
            {topDrivers.map((d,i) => (
              <div key={d.driverId} className="flex items-center gap-3">
                <span className="text-xs font-black text-gray-300 w-4">{i+1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{d.driverName}</p>
                  <p className="text-xs text-gray-400">{d.count} rating{d.count>1?'s':''}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black" style={{ color: STAR_COLOR }}>{d.avg.toFixed(2)} ★</p>
                  <AlertBadge avg={d.avg} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low drivers */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-base font-bold text-gray-900 mb-4">⚠ Requieren atención</h3>
          <div className="space-y-3">
            {lowDrivers.length === 0 && <p className="text-sm text-gray-400">Sin suficientes datos</p>}
            {lowDrivers.map((d,i) => (
              <div key={d.driverId} className={`flex items-center gap-3 p-2 rounded-xl ${d.avg < 3.5 ? 'bg-red-50' : ''}`}>
                <span className="text-xs font-black text-gray-300 w-4">{i+1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{d.driverName}</p>
                  <p className="text-xs text-gray-400">{d.count} rating{d.count>1?'s':''}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black" style={{ color: d.avg < 3.5 ? '#ef4444' : STAR_COLOR }}>{d.avg.toFixed(2)} ★</p>
                  <AlertBadge avg={d.avg} />
                </div>
              </div>
            ))}
          </div>
          {lowDrivers.some(d => d.avg < 3.5) && (
            <div className="mt-4 p-3 bg-red-50 rounded-xl">
              <p className="text-xs text-red-600 font-semibold">⚠ Conductores con rating &lt; 3.5 requieren seguimiento inmediato.</p>
            </div>
          )}
        </div>
      </div>

      {/* Filters + Recent list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 p-4 border-b border-gray-100 flex-wrap">
          <h3 className="text-base font-bold text-gray-900 flex-1">📋 Valoraciones recientes</h3>
          <select value={filterSvc} onChange={e => { setFilterSvc(e.target.value); setPage(0); }}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm">
            <option value="">Todos los servicios</option>
            <option value="transporte">🚗 Transporte</option>
            <option value="tours">🗺️ Tours</option>
            <option value="experiencias">🎭 Experiencias</option>
            <option value="alojamientos">🏨 Alojamientos</option>
            <option value="envios">📦 Envíos</option>
          </select>
          <select value={filterScore} onChange={e => { setFilterScore(e.target.value); setPage(0); }}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm">
            <option value="">Todas las estrellas</option>
            <option value="high">5★ Excelentes</option>
            <option value="mid">4★ Buenos</option>
            <option value="low">≤3★ Problemáticos</option>
          </select>
          {(filterSvc || filterScore) && (
            <button onClick={() => { setFilterSvc(''); setFilterScore(''); setPage(0); }} className="text-sm text-gray-400 hover:text-gray-600">✕</button>
          )}
        </div>

        {pageData.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No hay valoraciones con esos filtros</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {pageData.map(r => (
              <div key={r.id} className="px-5 py-4 flex items-start gap-4 hover:bg-gray-50">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm flex-shrink-0">
                  {r.serviceType === 'tours' ? '🗺️' : r.serviceType === 'experiencias' ? '🎭' : r.serviceType === 'alojamientos' ? '🏨' : '🚗'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-800">{r.driverName ?? 'Proveedor'}</p>
                    <Stars score={r.score} />
                    {r.score <= 3 && <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-semibold">⚠</span>}
                  </div>
                  {r.comment && <p className="text-sm text-gray-500 mt-0.5 truncate">"{r.comment}"</p>}
                  <p className="text-xs text-gray-400 mt-1">
                    {r.serviceType ?? 'servicio'} · {r.createdAt ? new Date(r.createdAt).toLocaleDateString('es-EC') : '—'}
                  </p>
                </div>
                <div className="text-lg font-black flex-shrink-0" style={{ color: r.score >= 4 ? STAR_COLOR : '#ef4444' }}>
                  {r.score}★
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400">{filtered.length} valoraciones · página {page+1} de {totalPages||1}</p>
          <div className="flex gap-2">
            <button disabled={page===0} onClick={() => setPage(p=>p-1)}
              className="px-3 py-1.5 text-xs border rounded-lg disabled:opacity-30 hover:bg-gray-50">← Ant</button>
            <button disabled={page>=totalPages-1} onClick={() => setPage(p=>p+1)}
              className="px-3 py-1.5 text-xs border rounded-lg disabled:opacity-30 hover:bg-gray-50">Sig →</button>
          </div>
        </div>
      </div>

    </AdminLayout>
  );
}
