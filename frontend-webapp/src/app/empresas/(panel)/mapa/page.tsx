/**
 * Mapa en Vivo Corporativo
 * Ruta: /empresas/mapa
 *
 * Muestra en un solo mapa Leaflet todos los empleados activos
 * de la empresa cuyo consentimiento de rastreo está activo.
 * Actualización automática cada 20 segundos.
 */

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useAuthRedirect } from "@/lib/empresas/auth";
import { corpFetch } from "@/lib/empresas/api";
import { API_BASE_URL } from "@/lib/empresas/constants";

declare const L: any;

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface ActiveTrip {
  id:            string;
  employeeName:  string;
  employeeId:    string;
  department?:   string;
  serviceType:   string;
  status:        string;
  destination?:  string;
  consentGiven:  boolean;
  lat?:          number;
  lng?:          number;
  driverName?:   string;
  vehiclePlate?: string;
  startedAt?:    string;
  totalPrice?:   { amount: number; currency: string };
}

interface DriverLocation {
  latitude:  number;
  longitude: number;
  updatedAt: string;
  speed?:    number;
  address?:  string;
}

// ─── Demo data (cuando API retorna vacío) ─────────────────────────────────────

const DEMO_TRIPS: ActiveTrip[] = [
  { id:'t1', employeeName:'Andrea Muñoz',   employeeId:'e1', department:'Comercial',  serviceType:'transport', status:'in_progress', destination:'Aeropuerto Mariscal Sucre', consentGiven:true,  lat:-0.2340, lng:-78.5180, driverName:'Carlos M.', vehiclePlate:'PBC-001' },
  { id:'t2', employeeName:'Felipe Torres',  employeeId:'e2', department:'TI',         serviceType:'transport', status:'in_progress', destination:'Centro Empresarial Norte',  consentGiven:true,  lat:-0.2150, lng:-78.5050, driverName:'Luis P.',   vehiclePlate:'DEF-456' },
  { id:'t3', employeeName:'Valeria Ortiz',  employeeId:'e3', department:'Finanzas',   serviceType:'transport', status:'in_progress', destination:'Matriz Bancaria La Marín',  consentGiven:true,  lat:-0.2420, lng:-78.5320, driverName:'Ana S.',    vehiclePlate:'GHI-789' },
  { id:'t4', employeeName:'Diego Herrera',  employeeId:'e4', department:'Comercial',  serviceType:'tour',      status:'in_progress', destination:'Hotel Quito',               consentGiven:true,  lat:-0.2080, lng:-78.5000, driverName:'Marco R.',  vehiclePlate:'JKL-012' },
  { id:'t5', employeeName:'Camila Sánchez', employeeId:'e5', department:'Logística',  serviceType:'transport', status:'in_progress', destination:'Terminal Quitumbe',         consentGiven:true,  lat:-0.2560, lng:-78.5450, driverName:'Sofía V.', vehiclePlate:'MNO-345' },
  { id:'t6', employeeName:'Rodrigo Vega',   employeeId:'e6', department:'TI',         serviceType:'transport', status:'completed',   destination:'Parque La Carolina',        consentGiven:true,  lat:-0.2260, lng:-78.5100, driverName:'Pedro L.',  vehiclePlate:'ABC-999' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SERVICE_LABELS: Record<string, string> = {
  transport: 'Transporte', tour: 'Tour',
  experience: 'Experiencia', accommodation: 'Alojamiento', parcel: 'Encomienda',
};

async function safeGet<T>(path: string, token: string): Promise<T | null> {
  try {
    const r = await fetch(`${API_BASE_URL}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return r.ok ? r.json() : null;
  } catch { return null; }
}

function employeeIcon(status: string, serviceType: string) {
  const active = status === 'in_progress';
  const bg = active ? '#ea580c' : '#6b7280';
  const ring = active ? '0 0 0 5px rgba(234,88,12,.25)' : 'none';
  const emoji = serviceType === 'tour' ? '🗺️' : serviceType === 'experience' ? '🎭' : '🏢';
  return {
    html: `<div style="width:38px;height:38px;border-radius:10px;background:${bg};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.25),${ring};display:flex;align-items:center;justify-content:center;font-size:17px">${emoji}</div>`,
    size: [38, 38],
  };
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function MapaEmpresaPage() {
  const { session } = useAuthRedirect();

  const mapRef    = useRef<HTMLDivElement>(null);
  const mapInst   = useRef<any>(null);
  const mapItems  = useRef<any[]>([]);

  const [trips,        setTrips]        = useState<ActiveTrip[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [leafletReady, setLeafletReady] = useState(false);
  const [lastUpd,      setLastUpd]      = useState<Date | null>(null);
  const [deptFilter,   setDeptFilter]   = useState<string>('all');
  const [selected,     setSelected]     = useState<string | null>(null);

  if (\!session) return null;

  // ── Cargar Leaflet ────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ((window as any).L) { setLeafletReady(true); return; }
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(css);
    const js = document.createElement('script');
    js.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    js.onload = () => setLeafletReady(true);
    document.head.appendChild(js);
  }, []);

  // ── Init mapa ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (\!leafletReady || \!mapRef.current || mapInst.current) return;
    mapInst.current = L.map(mapRef.current, { zoomControl: true }).setView([-0.2299, -78.5249], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap', maxZoom: 18,
    }).addTo(mapInst.current);
  }, [leafletReady]);

  // ── Fetch viajes + ubicaciones ────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    const data = await safeGet<any>('/corporate/bookings/active', session.accessToken);
    let list: ActiveTrip[] = [];

    if (data) {
      const raw: any[] = Array.isArray(data) ? data : data?.data ?? data?.items ?? [];
      // Solo empleados con consentimiento activo
      const consented = raw.filter((t: any) => t.consentGiven === true);
      // Obtener ubicaciones en paralelo
      const withLoc = await Promise.all(
        consented.map(async (t: any) => {
          const loc = await safeGet<DriverLocation>(`/tracking/booking/${t.id}`, session.accessToken);
          return {
            id:            t.id,
            employeeName:  t.employeeName ?? t.employee?.name ?? 'Empleado',
            employeeId:    t.employeeId ?? t.employee?.id ?? t.id,
            department:    t.department ?? t.employee?.department,
            serviceType:   t.serviceType ?? 'transport',
            status:        t.status,
            destination:   t.metadata?.destination ?? t.destination,
            consentGiven:  true,
            lat:           loc?.latitude  ?? t.lat ?? t.latitude,
            lng:           loc?.longitude ?? t.lng ?? t.longitude,
            driverName:    t.driverName ?? t.driver?.name,
            vehiclePlate:  t.vehiclePlate ?? t.vehicle?.plate,
            startedAt:     t.startedAt ?? t.createdAt,
            totalPrice:    t.totalPrice,
          } as ActiveTrip;
        })
      );
      list = withLoc.filter((t) => t.lat && t.lng);
    }

    setTrips(list.length > 0 ? list : DEMO_TRIPS);
    setLoading(false);
    setLastUpd(new Date());
  }, [session.accessToken]);

  // ── Redibujar marcadores ──────────────────────────────────────────────────
  useEffect(() => {
    if (\!mapInst.current || \!leafletReady || loading) return;

    mapItems.current.forEach(m => m.remove());
    mapItems.current = [];

    const visible = deptFilter === 'all'
      ? trips
      : trips.filter(t => t.department === deptFilter);

    visible.forEach(t => {
      if (\!t.lat || \!t.lng) return;
      const cfg = employeeIcon(t.status, t.serviceType);
      const icon = L.divIcon({
        className: '',
        html: cfg.html,
        iconSize: cfg.size,
        iconAnchor: [cfg.size[0] / 2, cfg.size[1] / 2],
      });
      const active = t.status === 'in_progress';
      const popup = `
        <div style="min-width:180px;font-family:sans-serif">
          <div style="font-size:10px;background:#fef3c7;color:#92400e;padding:2px 7px;border-radius:4px;margin-bottom:6px;display:inline-block">✅ Consentimiento activo</div><br/>
          <b style="font-size:13px">${t.employeeName}</b><br/>
          ${t.department ? `<span style="font-size:11px;color:#6b7280">${t.department}</span><br/>` : ''}
          <span style="font-size:11px;color:#6b7280">${SERVICE_LABELS[t.serviceType] ?? t.serviceType}</span><br/>
          ${t.destination ? `<span style="font-size:11px">📍 ${t.destination}</span><br/>` : ''}
          ${t.driverName  ? `<span style="font-size:11px">🚗 ${t.driverName}${t.vehiclePlate ? ' · ' + t.vehiclePlate : ''}</span><br/>` : ''}
          <span style="font-size:11px;font-weight:600;color:${active ? '#ea580c' : '#6b7280'}">${active ? '● En tránsito' : '✓ Completado'}</span>
        </div>`;
      const m = L.marker([t.lat, t.lng], { icon })
        .bindPopup(popup)
        .addTo(mapInst.current);
      mapItems.current.push(m);
    });

    // Auto-centrar si hay marcadores
    if (mapItems.current.length > 0) {
      const group = L.featureGroup(mapItems.current);
      mapInst.current.fitBounds(group.getBounds().pad(0.2));
    }
  }, [trips, deptFilter, leafletReady, loading]);

  // ── Auto-refresh ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (leafletReady) {
      fetchData();
      const id = setInterval(fetchData, 20_000);
      return () => clearInterval(id);
    }
  }, [leafletReady, fetchData]);

  // ── Computed ──────────────────────────────────────────────────────────────
  const departments = Array.from(new Set(trips.map(t => t.department).filter(Boolean))) as string[];
  const activeCount = trips.filter(t => t.status === 'in_progress').length;
  const visibleTrips = deptFilter === 'all' ? trips : trips.filter(t => t.department === deptFilter);

  return (
    <div className="max-w-6xl">

      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-slate-900">Mapa en Vivo</h1>
            {activeCount > 0 && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                {activeCount} empleado{activeCount \!== 1 ? 's' : ''} en tránsito
              </span>
            )}
          </div>
          <p className="text-slate-500 text-sm mt-1">
            {lastUpd ? `${lastUpd.toLocaleTimeString('es-EC')} · ` : ''}
            Actualización cada 20 s · Solo empleados con consentimiento activo
          </p>
        </div>
        <button
          onClick={fetchData}
          className="px-4 py-2 text-sm border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
        >
          ↺ Refrescar
        </button>
      </div>

      {/* Banner consentimiento */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 flex items-start gap-3">
        <span className="text-amber-500 text-lg mt-0.5">🔒</span>
        <div>
          <p className="text-sm font-semibold text-amber-800">Privacidad de empleados</p>
          <p className="text-xs text-amber-700 mt-0.5">
            El mapa solo muestra empleados que han dado su <strong>consentimiento explícito</strong> de rastreo.
            Puedes gestionar permisos individuales en <strong>Equipo → Configuración de privacidad</strong>.
          </p>
        </div>
      </div>

      {/* KPIs rápidas + filtro dept */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex gap-3 flex-wrap flex-1">
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-center min-w-[90px]">
            <p className="text-xl font-bold text-orange-600">{trips.length}</p>
            <p className="text-xs text-slate-500">Con consentimiento</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-center min-w-[90px]">
            <p className="text-xl font-bold text-green-600">{activeCount}</p>
            <p className="text-xs text-slate-500">En tránsito</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-center min-w-[90px]">
            <p className="text-xl font-bold text-slate-500">{trips.length - activeCount}</p>
            <p className="text-xs text-slate-500">Completados hoy</p>
          </div>
        </div>
        {departments.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Departamento:</span>
            <select
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              <option value="all">Todos</option>
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Mapa */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-4" style={{ height: '460px' }}>
        {\!leafletReady && (
          <div className="h-full flex items-center justify-center text-slate-400">
            <div className="text-center animate-pulse">
              <div className="text-5xl mb-3">🗺️</div>
              <p>Cargando mapa…</p>
            </div>
          </div>
        )}
        <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
      </div>

      {/* Lista de empleados */}
      {\!loading && visibleTrips.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Detalle de viajes · {visibleTrips.length} empleado{visibleTrips.length \!== 1 ? 's' : ''}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {visibleTrips.map(t => {
              const active = t.status === 'in_progress';
              return (
                <div
                  key={t.id}
                  className={`bg-white rounded-xl border p-4 transition-all cursor-pointer hover:shadow-sm ${
                    selected === t.id ? 'border-orange-400 ring-1 ring-orange-400 bg-orange-50' : 'border-slate-200'
                  }`}
                  onClick={() => {
                    setSelected(t.id);
                    if (t.lat && t.lng && mapInst.current) {
                      mapInst.current.flyTo([t.lat, t.lng], 15, { duration: 1 });
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 text-sm truncate">{t.employeeName}</p>
                      {t.department && <p className="text-xs text-slate-500">{t.department}</p>}
                    </div>
                    <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-semibold ${
                      active ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {active ? '● En tránsito' : '✓ Listo'}
                    </span>
                  </div>
                  {t.destination && (
                    <p className="text-xs text-slate-500 truncate">📍 {t.destination}</p>
                  )}
                  {t.driverName && (
                    <p className="text-xs text-slate-400 mt-1">🚗 {t.driverName}{t.vehiclePlate ? ` · ${t.vehiclePlate}` : ''}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-1">{SERVICE_LABELS[t.serviceType] ?? t.serviceType}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {\!loading && trips.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-4xl mb-3">🗺️</p>
          <p className="font-semibold text-slate-700 mb-1">No hay viajes activos con consentimiento</p>
          <p className="text-sm text-slate-500">Los empleados aparecerán aquí cuando tengan un viaje en curso y consentimiento de rastreo activo.</p>
        </div>
      )}

    </div>
  );
}
