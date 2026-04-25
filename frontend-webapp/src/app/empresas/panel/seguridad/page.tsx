/**
 * Seguridad de Viajes
 * Ruta: /empresas/seguridad
 *
 * Las empresas ven el score de seguridad de sus viajes,
 * incidentes detectados por dashcam y pueden solicitar grabaciones.
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuthRedirect } from "@/lib/empresas/auth";
import { corpFetch } from "@/lib/empresas/api";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type IncidentType = "harsh_braking" | "speeding" | "route_deviation" | "sos" | "collision";
type IncidentSeverity = "critical" | "warning" | "info";

interface TripSafety {
  id: string;
  employeeName: string;
  department?: string;
  date: string;
  serviceType: string;
  origin?: string;
  destination?: string;
  safetyScore: number;
  incidents: number;
  clipAvailable: boolean;
  recordingRequested?: boolean;
}

interface Incident {
  id: string; tripId: string;
  employeeName: string; department?: string;
  type: IncidentType; severity: IncidentSeverity;
  timestamp: string;
  speed?: number; maxSpeed?: number;
  clipDuration?: number;
  reviewed: boolean;
}

// ─── Demo data ────────────────────────────────────────────────────────────────

const DEMO_TRIPS: TripSafety[] = [
  { id:'t1', employeeName:'Andrea Muñoz',   department:'Comercial', date: new Date(Date.now()-86400000).toISOString(), serviceType:'transport', origin:'Oficina Norte', destination:'Aeropuerto', safetyScore:96, incidents:0, clipAvailable:false },
  { id:'t2', employeeName:'Felipe Torres',  department:'TI',        date: new Date(Date.now()-86400000).toISOString(), serviceType:'transport', origin:'Hotel Quito',   destination:'Centro Empresarial', safetyScore:82, incidents:1, clipAvailable:true  },
  { id:'t3', employeeName:'Valeria Ortiz',  department:'Finanzas',  date: new Date(Date.now()-172800000).toISOString(), serviceType:'transport', origin:'Casa',        destination:'Banco Central', safetyScore:58, incidents:2, clipAvailable:true  },
  { id:'t4', employeeName:'Diego Herrera',  department:'Comercial', date: new Date(Date.now()-172800000).toISOString(), serviceType:'tour',      origin:'Oficina',     destination:'Teleférico', safetyScore:95, incidents:0, clipAvailable:false },
  { id:'t5', employeeName:'Camila Sánchez', department:'Logística', date: new Date(Date.now()-259200000).toISOString(), serviceType:'transport', origin:'Terminal Q.',  destination:'Quicentro', safetyScore:74, incidents:1, clipAvailable:true, recordingRequested:true },
];

const DEMO_INCIDENTS: Incident[] = [
  { id:'i1', tripId:'t2', employeeName:'Felipe Torres', department:'TI',       type:'harsh_braking', severity:'warning',  timestamp: new Date(Date.now()-90000000).toISOString(), speed:65, clipDuration:12, reviewed:false },
  { id:'i2', tripId:'t3', employeeName:'Valeria Ortiz',  department:'Finanzas', type:'speeding',       severity:'warning',  timestamp: new Date(Date.now()-175000000).toISOString(), speed:98, maxSpeed:80, clipDuration:18, reviewed:true  },
  { id:'i3', tripId:'t3', employeeName:'Valeria Ortiz',  department:'Finanzas', type:'harsh_braking', severity:'warning',  timestamp: new Date(Date.now()-174000000).toISOString(), speed:70, clipDuration:10, reviewed:false },
  { id:'i4', tripId:'t5', employeeName:'Camila Sánchez', department:'Logística',type:'route_deviation',severity:'info',     timestamp: new Date(Date.now()-262000000).toISOString(), clipDuration:8,  reviewed:true  },
];

// ─── Constantes ───────────────────────────────────────────────────────────────

const INCIDENT_LABELS: Record<IncidentType, string> = {
  harsh_braking:'Frenada brusca', speeding:'Exceso velocidad',
  route_deviation:'Desvío de ruta', sos:'SOS activado', collision:'Posible colisión',
};
const INCIDENT_ICONS: Record<IncidentType, string> = {
  harsh_braking:'⚡', speeding:'🚨', route_deviation:'↗️', sos:'🆘', collision:'💥',
};
const SEV_COLORS: Record<IncidentSeverity, { text: string; bg: string }> = {
  critical: { text:'#dc2626', bg:'#fef2f2' },
  warning:  { text:'#d97706', bg:'#fffbeb' },
  info:     { text:'#2563eb', bg:'#eff6ff' },
};

function scoreColor(s: number) {
  if (s >= 85) return { text:'#15803d', bg:'#f0fdf4' };
  if (s >= 70) return { text:'#b45309', bg:'#fffbeb' };
  return { text:'#dc2626', bg:'#fef2f2' };
}

function timeAgo(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days === 0) return 'hoy';
  if (days === 1) return 'ayer';
  return `hace ${days} días`;
}

const SERVICE_LABELS: Record<string, string> = {
  transport:'Transporte', tour:'Tour', experience:'Experiencia', accommodation:'Alojamiento',
};

// ─── Página ───────────────────────────────────────────────────────────────────

export default function SeguridadEmpresaPage() {
  const { session } = useAuthRedirect();

  const [trips,      setTrips]      = useState<TripSafety[]>([]);
  const [incidents,  setIncidents]  = useState<Incident[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [tab,        setTab]        = useState<"overview" | "incidents">("overview");
  const [panel,      setPanel]      = useState<TripSafety | null>(null);
  const [requesting, setRequesting] = useState<string | null>(null);
  const [toast,      setToast]      = useState('');

  if (!session) return null;

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchData = useCallback(async () => {
    try {
      const [tripsData, incData] = await Promise.all([
        corpFetch<any>('/corporate/trips/safety', session!.accessToken),
        corpFetch<any>('/corporate/dashcam/incidents', session!.accessToken),
      ]);
      const tRaw: any[] = Array.isArray(tripsData) ? tripsData : tripsData?.data ?? [];
      const iRaw: any[] = Array.isArray(incData) ? incData : incData?.data ?? [];
      setTrips(tRaw.length > 0 ? tRaw : DEMO_TRIPS);
      setIncidents(iRaw.length > 0 ? iRaw : DEMO_INCIDENTS);
    } catch {
      setTrips(DEMO_TRIPS);
      setIncidents(DEMO_INCIDENTS);
    }
    setLoading(false);
  }, [session!.accessToken]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function requestClip(tripId: string) {
    setRequesting(tripId);
    try {
      await corpFetch<any>('/corporate/dashcam/clip-request', session!.accessToken, {
        method: 'POST',
        body: JSON.stringify({ tripId }),
      });
      setTrips(prev => prev.map(t => t.id === tripId ? { ...t, recordingRequested: true } : t));
      showToast('Solicitud enviada — recibirás el clip en 24 h');
    } catch {
      showToast('No se pudo enviar la solicitud. Intenta de nuevo.');
    }
    setRequesting(null);
    setPanel(null);
  }

  // ── Computed ─────────────────────────────────────────────────────────────
  const avgScore     = trips.length ? Math.round(trips.reduce((s, t) => s + t.safetyScore, 0) / trips.length) : 0;
  const tripsWithInc = trips.filter(t => t.incidents > 0).length;
  const totalInc     = incidents.length;
  const criticals    = incidents.filter(i => i.severity === 'critical').length;
  const sc           = scoreColor(avgScore);

  return (
    <div className="max-w-5xl">

      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      {/* Trip detail panel */}
      {panel && (
        <div className="fixed inset-0 z-40 flex">
          <div className="flex-1 bg-black/40" onClick={() => setPanel(null)} />
          <div className="w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="font-bold text-lg text-slate-900">Detalle del Viaje</h3>
              <button onClick={() => setPanel(null)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            <div className="p-6 flex-1 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">{panel.employeeName}</p>
                  {panel.department && <p className="text-sm text-slate-500">{panel.department}</p>}
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black" style={{ color: scoreColor(panel.safetyScore).text }}>
                    {panel.safetyScore}
                  </p>
                  <p className="text-xs text-slate-400">score seguridad</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Fecha</span><span className="font-medium">{new Date(panel.date).toLocaleDateString('es-EC')}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Servicio</span><span className="font-medium">{SERVICE_LABELS[panel.serviceType] ?? panel.serviceType}</span></div>
                {panel.origin && <div className="flex justify-between"><span className="text-slate-500">Origen</span><span className="font-medium truncate ml-2">{panel.origin}</span></div>}
                {panel.destination && <div className="flex justify-between"><span className="text-slate-500">Destino</span><span className="font-medium truncate ml-2">{panel.destination}</span></div>}
                <div className="flex justify-between"><span className="text-slate-500">Incidentes</span><span className="font-bold" style={{ color: panel.incidents > 0 ? '#dc2626' : '#15803d' }}>{panel.incidents}</span></div>
              </div>

              {/* Incidents for this trip */}
              {incidents.filter(i => i.tripId === panel.id).length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-2">Incidentes detectados</p>
                  <div className="space-y-2">
                    {incidents.filter(i => i.tripId === panel.id).map(inc => (
                      <div key={inc.id} className="rounded-lg p-3 text-sm flex items-center gap-2"
                        style={{ backgroundColor: SEV_COLORS[inc.severity].bg }}>
                        <span>{INCIDENT_ICONS[inc.type]}</span>
                        <div className="flex-1">
                          <p className="font-medium" style={{ color: SEV_COLORS[inc.severity].text }}>
                            {INCIDENT_LABELS[inc.type]}
                          </p>
                          {inc.speed && <p className="text-xs opacity-70">{inc.speed} km/h{inc.maxSpeed ? ` (límite ${inc.maxSpeed})` : ''}</p>}
                        </div>
                        {inc.clipDuration && <span className="text-xs opacity-60">📹 {inc.clipDuration}s</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Clip request */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-blue-800 mb-1">📹 Grabación del viaje</p>
                {panel.recordingRequested ? (
                  <p className="text-sm text-blue-700">✅ Solicitud enviada — recibirás el clip en 24 h</p>
                ) : panel.clipAvailable ? (
                  <>
                    <p className="text-xs text-blue-600 mb-3">La grabación dashcam está disponible para este viaje.</p>
                    <button
                      onClick={() => requestClip(panel.id)}
                      disabled={requesting === panel.id}
                      className="w-full py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {requesting === panel.id ? 'Enviando…' : 'Solicitar grabación completa'}
                    </button>
                  </>
                ) : (
                  <p className="text-xs text-blue-600">No hay incidentes registrados para este viaje — no se guarda grabación.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Seguridad de Viajes</h1>
        <p className="text-slate-500 text-sm mt-1">Monitoreo dashcam · incidentes detectados · grabaciones disponibles</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-2xl border p-5 shadow-sm" style={{ backgroundColor: sc.bg, borderColor: sc.text + '30' }}>
          <p className="text-xs font-medium text-slate-500 mb-1">Score promedio</p>
          <p className="text-3xl font-black" style={{ color: sc.text }}>{avgScore}</p>
          <p className="text-xs mt-1" style={{ color: sc.text }}>
            {avgScore >= 85 ? '✅ Excelente' : avgScore >= 70 ? '⚠️ Aceptable' : '🔴 Requiere atención'}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500 mb-1">Viajes analizados</p>
          <p className="text-3xl font-black text-slate-900">{trips.length}</p>
          <p className="text-xs text-slate-400 mt-1">últimos 30 días</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500 mb-1">Viajes con incidentes</p>
          <p className="text-3xl font-black" style={{ color: tripsWithInc > 0 ? '#d97706' : '#15803d' }}>{tripsWithInc}</p>
          <p className="text-xs text-slate-400 mt-1">{trips.length > 0 ? Math.round(tripsWithInc / trips.length * 100) : 0}% del total</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500 mb-1">Incidentes totales</p>
          <p className="text-3xl font-black" style={{ color: criticals > 0 ? '#dc2626' : '#d97706' }}>{totalInc}</p>
          {criticals > 0 && <p className="text-xs text-red-600 font-semibold mt-1">⚠ {criticals} crítico{criticals !== 1 ? 's' : ''}</p>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-5 w-fit">
        {(['overview', 'incidents'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {t === 'overview' ? '📋 Viajes' : `⚠️ Incidentes (${totalInc})`}
          </button>
        ))}
      </div>

      {/* Trips tab */}
      {tab === 'overview' && (
        <div className="space-y-3">
          {loading && [1,2,3].map(i => <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />)}
          {!loading && trips.map(t => {
            const sc2 = scoreColor(t.safetyScore);
            return (
              <div key={t.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm cursor-pointer hover:shadow-md transition-all flex items-center gap-4"
                onClick={() => setPanel(t)}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg flex-shrink-0"
                  style={{ backgroundColor: sc2.bg, color: sc2.text }}>
                  {t.safetyScore}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-slate-900 text-sm">{t.employeeName}</p>
                    {t.department && <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{t.department}</span>}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {t.origin ? `${t.origin} → ${t.destination ?? ''}` : t.destination ?? ''} · {timeAgo(t.date)}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {t.incidents > 0 && (
                    <span className="text-xs bg-amber-50 text-amber-700 font-semibold px-2 py-0.5 rounded-full border border-amber-200">
                      {t.incidents} incid.
                    </span>
                  )}
                  {t.clipAvailable && !t.recordingRequested && (
                    <span className="text-xs bg-blue-50 text-blue-600 font-semibold px-2 py-0.5 rounded-full border border-blue-200">
                      📹 Clip disponible
                    </span>
                  )}
                  {t.recordingRequested && (
                    <span className="text-xs bg-green-50 text-green-600 font-semibold px-2 py-0.5 rounded-full border border-green-200">
                      ✅ Clip solicitado
                    </span>
                  )}
                  <span className="text-slate-300 text-sm">→</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Incidents tab */}
      {tab === 'incidents' && (
        <div className="space-y-3">
          {incidents.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <div className="text-4xl mb-2">✅</div>
              <p className="font-semibold text-slate-700">Sin incidentes registrados</p>
            </div>
          )}
          {[...incidents]
            .sort((a, b) => { const o = { critical:0, warning:1, info:2 }; return o[a.severity]-o[b.severity]; })
            .map(inc => (
            <div key={inc.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm"
              style={{ borderLeft: `4px solid ${SEV_COLORS[inc.severity].text}` }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{INCIDENT_ICONS[inc.type]}</span>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{INCIDENT_LABELS[inc.type]}</p>
                    <p className="text-xs text-slate-500">{inc.employeeName}{inc.department ? ` · ${inc.department}` : ''}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {timeAgo(inc.timestamp)} · {new Date(inc.timestamp).toLocaleTimeString('es-EC', { hour:'2-digit', minute:'2-digit' })}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: SEV_COLORS[inc.severity].bg, color: SEV_COLORS[inc.severity].text }}>
                    {inc.severity === 'critical' ? 'CRÍTICO' : inc.severity === 'warning' ? 'AVISO' : 'INFO'}
                  </span>
                  {inc.reviewed && <span className="text-xs text-green-600 font-medium">✓ Revisado</span>}
                </div>
              </div>
              {(inc.speed != null || inc.clipDuration != null) && (
                <div className="flex gap-4 mt-2 text-xs text-slate-400">
                  {inc.speed != null && <span>⚡ {inc.speed} km/h{inc.maxSpeed ? ` (límite ${inc.maxSpeed})` : ''}</span>}
                  {inc.clipDuration && <span>📹 {inc.clipDuration}s de clip</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
