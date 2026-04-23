'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';
import { AdminLayout } from '../components';
import { Loading } from '@going-monorepo-clean/shared-ui';
import { API } from '../../lib/admin-api';

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface CamVehicle {
  id: string; plate: string; driverName: string;
  status: 'online' | 'offline' | 'recording' | 'incident';
  safetyScore: number;   // 0-100
  incidentsToday: number;
  lastSeen?: string;
  streamUrl?: string;
  model?: string;
}

type IncidentType = 'harsh_braking' | 'speeding' | 'route_deviation' | 'sos' | 'collision' | 'fatigue';
type IncidentSeverity = 'critical' | 'warning' | 'info';

interface Incident {
  id: string; vehicleId: string; plate: string; driverName: string;
  type: IncidentType; severity: IncidentSeverity;
  lat: number; lng: number; timestamp: string;
  speed?: number; maxSpeed?: number;
  clipDuration?: number;   // segundos
  reviewed: boolean; dismissed: boolean;
  bookingId?: string; passengerId?: string;
}

async function safeGet<T>(token: string, path: string): Promise<T | null> {
  try {
    const r = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
    return r.ok ? r.json() : null;
  } catch { return null; }
}

async function adminFetch(token: string, path: string, opts?: RequestInit) {
  const r = await fetch(`${API}${path}`, {
    ...opts, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(opts?.headers ?? {}) },
  });
  if (\!r.ok) throw new Error(await r.text());
  return r.json();
}

/* ─── Demo data ─────────────────────────────────────────────────────────── */


/* ─── Constants ──────────────────────────────────────────────────────────── */
const INCIDENT_LABELS: Record<IncidentType, string> = {
  harsh_braking:   'Frenada brusca',
  speeding:        'Exceso de velocidad',
  route_deviation: 'Desvío de ruta',
  sos:             'SOS activado',
  collision:       'Posible colisión',
  fatigue:         'Alerta de fatiga',
};
const INCIDENT_ICONS: Record<IncidentType, string> = {
  harsh_braking:'⚡', speeding:'🚨', route_deviation:'↗️', sos:'🆘', collision:'💥', fatigue:'😴',
};
const SEV_COLOR: Record<IncidentSeverity, string> = {
  critical: '#dc2626', warning: '#f59e0b', info: '#3b82f6',
};
const SEV_BG: Record<IncidentSeverity, string> = {
  critical: '#fef2f2', warning: '#fffbeb', info: '#eff6ff',
};
const STATUS_CFG = {
  recording: { label:'Grabando',  color:'#3b82f6', bg:'#eff6ff',  dot:'animate-pulse' },
  online:    { label:'En línea',  color:'#22c55e', bg:'#f0fdf4',  dot:'' },
  incident:  { label:'Incidente', color:'#dc2626', bg:'#fef2f2',  dot:'animate-pulse' },
  offline:   { label:'Sin señal', color:'#9ca3af', bg:'#f9fafb',  dot:'' },
};

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'ahora mismo';
  if (s < 3600) return `hace ${Math.floor(s/60)}m`;
  return `hace ${Math.floor(s/3600)}h`;
}

function scoreColor(s: number) {
  if (s >= 85) return '#22c55e';
  if (s >= 70) return '#f59e0b';
  return '#dc2626';
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function DashcamPage() {
  const { auth } = useMonorepoApp();
  const token: string = typeof window \!== 'undefined' ? localStorage.getItem('authToken') ?? '' : '';

  const [vehicles,   setVehicles]   = useState<CamVehicle[]>([]);
  const [incidents,  setIncidents]  = useState<Incident[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [panel,      setPanel]      = useState<Incident | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sevFilter,  setSevFilter]  = useState<string>('all');
  const [toastMsg,   setToastMsg]   = useState('');
  const [lastUpd,    setLastUpd]    = useState<Date | null>(null);

  const toast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(''), 3000); };

  const fetchData = useCallback(async () => {
    const [vData, iData] = await Promise.all([
      safeGet<any>(token, '/vehicles?limit=100'),
      safeGet<any>(token, '/dashcam/incidents?limit=100'),
    ]);

    const vRaw: any[] = Array.isArray(vData) ? vData : vData?.data ?? vData?.items ?? [];
    setVehicles(vRaw.map((v: any) => ({
      id: v.id, plate: v.plate ?? v.licensePlate ?? '',
      driverName: v.driverName ?? v.driver?.name ?? 'Sin asignar',
      status: v.dashcamStatus ?? (v.status === 'active' ? 'online' : 'offline'),
      safetyScore: v.safetyScore ?? 80,
      incidentsToday: v.incidentsToday ?? 0,
      lastSeen: v.lastSeen ?? v.updatedAt,
      model: v.model ?? v.brand,
    })));

    const iRaw: any[] = Array.isArray(iData) ? iData : iData?.data ?? iData?.items ?? [];
    setIncidents(iRaw);

    setLoading(false); setLastUpd(new Date());
  }, [token]);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 30_000);
    return () => clearInterval(id);
  }, [fetchData]);

  async function markReviewed(inc: Incident) {
    try {
      await adminFetch(token, `/dashcam/incidents/${inc.id}/review`, { method: 'PATCH' });
    } catch {}
    setIncidents(prev => prev.map(i => i.id === inc.id ? { ...i, reviewed: true } : i));
    toast('Incidente marcado como revisado');
    setPanel(null);
  }

  async function dismissIncident(inc: Incident) {
    try {
      await adminFetch(token, `/dashcam/incidents/${inc.id}/dismiss`, { method: 'PATCH' });
    } catch {}
    setIncidents(prev => prev.map(i => i.id === inc.id ? { ...i, dismissed: true } : i));
    toast('Incidente descartado');
    setPanel(null);
  }

  if (auth.isLoading || loading) return <Loading fullHeight size="lg" message="Cargando dashcam…" />;

  const online    = vehicles.filter(v => v.status \!== 'offline').length;
  const recording = vehicles.filter(v => v.status === 'recording').length;
  const incidents_active = incidents.filter(i => \!i.dismissed);
  const criticals = incidents_active.filter(i => i.severity === 'critical').length;
  const avgScore  = Math.round(vehicles.reduce((s, v) => s + v.safetyScore, 0) / (vehicles.length || 1));

  const filteredVehicles = vehicles.filter(v => statusFilter === 'all' || v.status === statusFilter);
  const filteredIncidents = incidents_active
    .filter(i => sevFilter === 'all' || i.severity === sevFilter)
    .sort((a, b) => {
      const o = { critical: 0, warning: 1, info: 2 };
      return o[a.severity] - o[b.severity] || new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

  return (
    <AdminLayout userName={auth.user?.firstName ?? 'Admin'} onLogout={auth.logout}>

      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg animate-pulse">
          {toastMsg}
        </div>
      )}

      {/* Incident detail panel */}
      {panel && (
        <div className="fixed inset-0 z-40 flex">
          <div className="flex-1 bg-black/40" onClick={() => setPanel(null)} />
          <div className="w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="font-bold text-lg text-gray-900">Detalle del Incidente</h3>
              <button onClick={() => setPanel(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="p-6 flex-1 space-y-5">
              {/* Severity badge */}
              <div className="flex items-center gap-3">
                <span className="text-4xl">{INCIDENT_ICONS[panel.type]}</span>
                <div>
                  <p className="font-bold text-gray-900">{INCIDENT_LABELS[panel.type]}</p>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: SEV_BG[panel.severity], color: SEV_COLOR[panel.severity] }}>
                    {panel.severity === 'critical' ? '🔴 CRÍTICO' : panel.severity === 'warning' ? '🟡 ADVERTENCIA' : '🔵 INFO'}
                  </span>
                </div>
              </div>

              {/* Vehicle + driver */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Vehículo</span>
                  <span className="font-semibold">{panel.plate}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Conductor</span>
                  <span className="font-semibold">{panel.driverName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Hora</span>
                  <span className="font-semibold">{new Date(panel.timestamp).toLocaleString('es-EC')}</span>
                </div>
                {panel.speed \!= null && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Velocidad</span>
                    <span className="font-semibold text-red-600">{panel.speed} km/h{panel.maxSpeed ? ` (límite: ${panel.maxSpeed})` : ''}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Coordenadas</span>
                  <span className="font-mono text-xs text-gray-600">{panel.lat.toFixed(4)}, {panel.lng.toFixed(4)}</span>
                </div>
              </div>

              {/* Clip player (placeholder) */}
              {panel.clipDuration && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">📹 Clip del incidente ({panel.clipDuration}s)</p>
                  <div className="bg-gray-900 rounded-xl aspect-video flex items-center justify-center relative overflow-hidden">
                    <div className="text-center text-white">
                      <div className="text-5xl mb-2">▶</div>
                      <p className="text-sm opacity-70">Clip disponible</p>
                      <p className="text-xs opacity-50 mt-1">{panel.clipDuration}s · Dashcam frontal</p>
                    </div>
                    <div className="absolute bottom-3 right-3 flex gap-2">
                      <button className="text-xs bg-white/20 text-white px-3 py-1 rounded-lg hover:bg-white/30 transition-colors">
                        ⬇ Descargar
                      </button>
                      <button className="text-xs bg-white/20 text-white px-3 py-1 rounded-lg hover:bg-white/30 transition-colors">
                        📤 Compartir
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Map thumbnail */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">📍 Ubicación del incidente</p>
                <iframe
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${panel.lng-0.008},${panel.lat-0.008},${panel.lng+0.008},${panel.lat+0.008}&layer=mapnik&marker=${panel.lat},${panel.lng}`}
                  className="w-full h-40 rounded-xl border border-gray-200"
                  title="Ubicación"
                />
              </div>

              {/* Status */}
              {panel.reviewed && (
                <div className="bg-green-50 rounded-xl p-3 text-sm text-green-700 font-medium">
                  ✅ Ya revisado por el equipo
                </div>
              )}
            </div>
            <div className="p-6 border-t flex gap-3">
              {\!panel.reviewed && (
                <button onClick={() => markReviewed(panel)}
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors"
                  style={{ backgroundColor: '#011627' }}>
                  ✓ Marcar revisado
                </button>
              )}
              <button onClick={() => dismissIncident(panel)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors">
                Descartar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashcam Fleet</h1>
          <p className="text-sm text-gray-500 mt-1">
            {lastUpd ? `${lastUpd.toLocaleTimeString('es-EC')} · ` : ''}
            {online}/{vehicles.length} cámaras en línea · actualización cada 30 s
          </p>
        </div>
        <button onClick={fetchData} className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
          ↺ Refrescar
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label:'Cámaras en línea',   value: `${online}/${vehicles.length}`,  color:'#22c55e',  icon:'📹' },
          { label:'Grabando ahora',      value: recording,                        color:'#3b82f6',  icon:'🔴' },
          { label:'Incidentes hoy',      value: incidents_active.length,          color: criticals > 0 ? '#dc2626' : '#f59e0b', icon:'⚠️' },
          { label:'Score promedio flota', value: `${avgScore}/100`,               color: scoreColor(avgScore), icon:'⭐' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{k.icon}</span>
              <span className="text-xs text-gray-500 font-medium">{k.label}</span>
            </div>
            <p className="text-2xl font-black" style={{ color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Camera fleet grid */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900">Flota de Cámaras</h2>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 focus:outline-none">
              <option value="all">Todos los estados</option>
              <option value="recording">Grabando</option>
              <option value="online">En línea</option>
              <option value="incident">Con incidente</option>
              <option value="offline">Sin señal</option>
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredVehicles.map(v => {
              const cfg = STATUS_CFG[v.status];
              return (
                <div key={v.id} className="bg-white rounded-2xl border p-4 shadow-sm"
                  style={{ borderColor: v.status === 'incident' ? '#fca5a5' : '#f3f4f6' }}>
                  {/* Camera thumbnail */}
                  <div className="relative bg-gray-900 rounded-xl aspect-video mb-3 overflow-hidden flex items-center justify-center">
                    {v.status === 'offline' ? (
                      <div className="text-center text-gray-500">
                        <div className="text-2xl mb-1">📵</div>
                        <p className="text-xs">Sin señal</p>
                      </div>
                    ) : (
                      <div className="text-center text-white/70">
                        <div className="text-2xl mb-1">📹</div>
                        <p className="text-xs">{v.status === 'recording' ? 'En vivo' : 'Conectada'}</p>
                      </div>
                    )}
                    {/* REC indicator */}
                    {v.status === 'recording' && (
                      <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 px-2 py-0.5 rounded-full">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-white text-xs font-bold">REC</span>
                      </div>
                    )}
                    {v.status === 'incident' && (
                      <div className="absolute top-2 left-2 bg-red-600 px-2 py-0.5 rounded-full">
                        <span className="text-white text-xs font-bold animate-pulse">⚠ INCIDENTE</span>
                      </div>
                    )}
                    <span className="absolute bottom-2 right-2 text-xs text-white/50">{v.plate}</span>
                  </div>

                  {/* Info */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{v.driverName}</p>
                      <p className="text-xs text-gray-500 truncate">{v.model} · {v.plate}</p>
                    </div>
                    <span className="flex-shrink-0 flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                      <span className={`w-1.5 h-1.5 rounded-full inline-block ${cfg.dot}`}
                        style={{ backgroundColor: cfg.color }} />
                      {cfg.label}
                    </span>
                  </div>

                  {/* Score + incidents */}
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-400">Score seguridad</span>
                        <span className="font-bold" style={{ color: scoreColor(v.safetyScore) }}>{v.safetyScore}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${v.safetyScore}%`, backgroundColor: scoreColor(v.safetyScore) }} />
                      </div>
                    </div>
                    {v.incidentsToday > 0 && (
                      <span className="text-xs bg-red-50 text-red-600 font-bold px-2 py-0.5 rounded-full">
                        {v.incidentsToday} incid.
                      </span>
                    )}
                  </div>
                  {v.lastSeen && (
                    <p className="text-xs text-gray-400 mt-2">Última señal: {timeAgo(v.lastSeen)}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Incident feed */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              Incidentes
              {criticals > 0 && (
                <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full font-bold animate-pulse">
                  {criticals} crítico{criticals \!== 1 ? 's' : ''}
                </span>
              )}
            </h2>
            <select value={sevFilter} onChange={e => setSevFilter(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 focus:outline-none">
              <option value="all">Todos</option>
              <option value="critical">Críticos</option>
              <option value="warning">Advertencias</option>
              <option value="info">Informativos</option>
            </select>
          </div>

          {filteredIncidents.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
              <div className="text-4xl mb-2">✅</div>
              <p className="text-sm font-medium">Sin incidentes activos</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredIncidents.map(inc => (
                <div key={inc.id}
                  className="bg-white rounded-2xl border p-4 shadow-sm cursor-pointer hover:shadow-md transition-all"
                  style={{ borderLeft: `4px solid ${SEV_COLOR[inc.severity]}` }}
                  onClick={() => setPanel(inc)}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{INCIDENT_ICONS[inc.type]}</span>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{INCIDENT_LABELS[inc.type]}</p>
                        <p className="text-xs text-gray-500">{inc.driverName} · {inc.plate}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: SEV_BG[inc.severity], color: SEV_COLOR[inc.severity] }}>
                        {inc.severity === 'critical' ? 'CRÍTICO' : inc.severity === 'warning' ? 'AVISO' : 'INFO'}
                      </span>
                      {inc.reviewed && <span className="text-xs text-green-600 font-medium">✓ Revisado</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span>🕐 {timeAgo(inc.timestamp)}</span>
                    {inc.speed \!= null && <span>⚡ {inc.speed} km/h</span>}
                    {inc.clipDuration && <span>📹 {inc.clipDuration}s de clip</span>}
                    <span className="ml-auto text-blue-500 font-medium">Ver →</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Safety leaderboard */}
          <div className="mt-6">
            <h2 className="font-bold text-gray-900 mb-3">Ranking Seguridad</h2>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {[...vehicles].sort((a, b) => b.safetyScore - a.safetyScore).slice(0, 6).map((v, idx) => (
                <div key={v.id} className={`flex items-center gap-3 px-4 py-3 ${idx < 5 ? 'border-b border-gray-50' : ''}`}>
                  <span className="text-sm font-black text-gray-400 w-5">#{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{v.driverName}</p>
                    <p className="text-xs text-gray-500">{v.plate}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${v.safetyScore}%`, backgroundColor: scoreColor(v.safetyScore) }} />
                    </div>
                    <span className="text-sm font-black w-8 text-right" style={{ color: scoreColor(v.safetyScore) }}>
                      {v.safetyScore}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </AdminLayout>
  );
}
                                                                                                                 