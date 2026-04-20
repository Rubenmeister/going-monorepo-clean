'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { adminFetch } from '../../lib/admin-api';

export const dynamic = 'force-dynamic';

// ─── Types ────────────────────────────────────────────────────────────────────

type ServiceType = 'transporte' | 'envios' | 'tours' | 'experiencias' | 'alojamientos';

interface LiveEvent {
  id: string;
  type: 'ride_accepted' | 'ride_started' | 'ride_completed' | 'ride_cancelled' | 'driver_online' | 'driver_offline' | 'info';
  service: ServiceType;
  title: string;
  subtitle?: string;
  ts: Date;
  driverId?: string;
  driverName?: string;
  lat?: number;
  lng?: number;
}

interface ActiveDriver {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: string;
  lastUpdate: Date;
}

interface ServiceCard {
  key: ServiceType;
  label: string;
  icon: string;
  color: string;
  active: number;
  total: number;
  trend: 'up' | 'down' | 'flat';
}

type SocketStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
type StatsRes = { activeRides?: number; completedToday?: number; cancelledToday?: number };
type DriversRes = { drivers?: Array<{ id: string; name?: string; lat?: number; lng?: number; status?: string; lastUpdate?: string }> };
type IoFn = (url: string, opts: unknown) => unknown;
type SocketApi = { on: (ev: string, cb: (...a: unknown[]) => void) => void; emit: (ev: string, ...a: unknown[]) => void };
type PushEventArg = Omit<LiveEvent, 'id' | 'ts'>;
type Disconnectable = { disconnect: () => void };
type LocationData = { driverId?: string; id?: string; name?: string; lat?: number; latitude?: number; lng?: number; longitude?: number; status?: string };
type RideData = { driverName?: string; origin?: string; destination?: string };
type RideCompleteData = { driverName?: string; amount?: number };
type CancelData = { reason?: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(d: Date): string {
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 5) return 'ahora';
  if (s < 60) return `hace ${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `hace ${m}m`;
  return `hace ${Math.floor(m / 60)}h`;
}

function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

const EVENT_CONFIG: Record<LiveEvent['type'], { bg: string; border: string; icon: string; label: string }> = {
  ride_accepted:   { bg: '#ecfdf5', border: '#10b981', icon: '✅', label: 'Aceptado' },
  ride_started:    { bg: '#eff6ff', border: '#3b82f6', icon: '🚗', label: 'En curso' },
  ride_completed:  { bg: '#f0fdf4', border: '#22c55e', icon: '🏁', label: 'Completado' },
  ride_cancelled:  { bg: '#fff1f2', border: '#f43f5e', icon: '❌', label: 'Cancelado' },
  driver_online:   { bg: '#fefce8', border: '#eab308', icon: '🟢', label: 'Online' },
  driver_offline:  { bg: '#f9fafb', border: '#9ca3af', icon: '⚫', label: 'Offline' },
  info:            { bg: '#f5f3ff', border: '#8b5cf6', icon: 'ℹ️', label: 'Info' },
};

const SERVICE_CONFIG: Record<ServiceType, { label: string; icon: string; color: string }> = {
  transporte:    { label: 'Transporte',    icon: '🚗', color: '#ff4c41' },
  envios:        { label: 'Envíos',        icon: '📦', color: '#0033A0' },
  tours:         { label: 'Tours',         icon: '🗺️', color: '#059669' },
  experiencias:  { label: 'Experiencias',  icon: '🎭', color: '#7c3aed' },
  alojamientos:  { label: 'Alojamientos',  icon: '🏨', color: '#d97706' },
};

// Socket.io CDN loader
let ioLoaded = false;
let ioLoading = false;
const ioCallbacks: Array<(io: unknown) => void> = [];

function loadSocketIO(): Promise<unknown> {
  return new Promise((resolve) => {
    if (ioLoaded) { resolve((window as never)['io']); return; }
    ioCallbacks.push(resolve);
    if (ioLoading) return;
    ioLoading = true;
    const s = document.createElement('script');
    s.src = 'https://cdn.socket.io/4.7.5/socket.io.min.js';
    s.onload = () => {
      ioLoaded = true;
      ioLoading = false;
      const io = (window as never)['io'];
      ioCallbacks.forEach(cb => cb(io));
      ioCallbacks.length = 0;
    };
    document.head.appendChild(s);
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusDot({ status }: { status: SocketStatus }) {
  const map: Record<SocketStatus, { color: string; label: string; pulse: boolean }> = {
    connected:    { color: '#22c55e', label: 'Conectado',   pulse: false },
    connecting:   { color: '#eab308', label: 'Conectando…', pulse: true },
    disconnected: { color: '#9ca3af', label: 'Desconectado',pulse: false },
    error:        { color: '#ef4444', label: 'Error',       pulse: false },
  };
  const c = map[status];
  return (
    <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: c.color }}>
      <span
        className="inline-block w-2 h-2 rounded-full"
        style={{ backgroundColor: c.color, animation: c.pulse ? 'pulse 1s infinite' : undefined }}
      />
      {c.label}
    </span>
  );
}

function EventRow({ ev }: { ev: LiveEvent }) {
  const cfg = EVENT_CONFIG[ev.type];
  const svc = SERVICE_CONFIG[ev.service];
  return (
    <div
      className="flex items-start gap-3 p-3 rounded-xl border-l-4 mb-2"
      style={{ backgroundColor: cfg.bg, borderLeftColor: cfg.border }}
    >
      <span className="text-lg mt-0.5 flex-shrink-0">{cfg.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-gray-900 text-sm">{ev.title}</span>
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full text-white"
            style={{ backgroundColor: svc.color }}
          >
            {svc.icon} {svc.label}
          </span>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
            {cfg.label}
          </span>
        </div>
        {ev.subtitle && <p className="text-xs text-gray-500 mt-0.5 truncate">{ev.subtitle}</p>}
      </div>
      <span className="text-xs text-gray-400 flex-shrink-0 mt-0.5">{timeAgo(ev.ts)}</span>
    </div>
  );
}

function DriverPin({ driver }: { driver: ActiveDriver }) {
  const mins = Math.floor((Date.now() - driver.lastUpdate.getTime()) / 60000);
  const fresh = mins < 3;
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-gray-100 hover:border-gray-200 transition-colors">
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
        style={{ backgroundColor: fresh ? '#22c55e' : '#9ca3af' }}
      >
        {driver.name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{driver.name}</p>
        <p className="text-xs text-gray-400">
          {driver.lat.toFixed(4)}, {driver.lng.toFixed(4)} · {mins < 1 ? 'ahora' : `hace ${mins}m`}
        </p>
      </div>
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: fresh ? '#22c55e' : '#9ca3af' }}
      />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OperationsPage() {
  const [socketStatus, setSocketStatus] = useState('disconnected' as SocketStatus);
  const [liveEvents, setLiveEvents] = useState([] as LiveEvent[]);
  const [activeDrivers, setActiveDrivers] = useState([] as ActiveDriver[]);
  const [services, setServices] = useState([
    { key: 'transporte',   label: 'Transporte',   icon: '🚗', color: '#ff4c41', active: 0, total: 0, trend: 'flat' },
    { key: 'envios',       label: 'Envíos',       icon: '📦', color: '#0033A0', active: 0, total: 0, trend: 'flat' },
    { key: 'tours',        label: 'Tours',        icon: '🗺️', color: '#059669', active: 0, total: 0, trend: 'flat' },
    { key: 'experiencias', label: 'Experiencias', icon: '🎭', color: '#7c3aed', active: 0, total: 0, trend: 'flat' },
    { key: 'alojamientos', label: 'Alojamientos', icon: '🏨', color: '#d97706', active: 0, total: 0, trend: 'flat' },
  ] as ServiceCard[]);
  const [totalOps, setTotalOps] = useState(0);
  const [filterService, setFilterService] = useState('all' as ServiceType | 'all');
  const socketRef = useRef<unknown>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const handlersRef = useRef({ setLiveEvents, setActiveDrivers, setServices });
  handlersRef.current = { setLiveEvents, setActiveDrivers, setServices };

  // Auto-scroll feed
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [liveEvents]);

  // Push event helper
  const pushEvent = useCallback((ev: PushEventArg) => {
    const full: LiveEvent = { ...ev, id: uid(), ts: new Date() };
    setLiveEvents(prev => [...prev.slice(-99), full]);
    if (ev.type === 'ride_started') {
      setServices(prev => prev.map(s =>
        s.key === ev.service ? { ...s, active: s.active + 1, total: s.total + 1 } : s
      ));
    }
    if (ev.type === 'ride_completed' || ev.type === 'ride_cancelled') {
      setServices(prev => prev.map(s =>
        s.key === ev.service ? { ...s, active: Math.max(0, s.active - 1) } : s
      ));
    }
  }, []);

  // Load transport stats
  const loadStats = useCallback(async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      if (!token) return;

      const statsRes = (await adminFetch(
        '/admin/stats/transport',
        token
      ).catch(() => null)) as (StatsRes | null);

      if (statsRes) {
        const active = statsRes.activeRides ?? 0;
        const total = (statsRes.completedToday ?? 0) + (statsRes.cancelledToday ?? 0) + active;
        setServices(prev => prev.map(s =>
          s.key === 'transporte' ? { ...s, active, total } : s
        ));
        setTotalOps(active);
      }

      // Active drivers from GPS
      const driversRes = (await adminFetch(
        '/admin/active-drivers',
        token
      ).catch(() => null)) as (DriversRes | null);

      if (driversRes?.drivers) {
        setActiveDrivers(driversRes.drivers.map(d => ({
          id: d.id,
          name: d.name ?? `Conductor ${d.id.slice(-4)}`,
          lat: d.lat ?? 0,
          lng: d.lng ?? 0,
          status: d.status ?? 'online',
          lastUpdate: new Date(d.lastUpdate ?? Date.now()),
        })));
      }
    } catch (_) { /* silent */ }
  }, []);

  // WebSocket connection
  useEffect(() => {
    let socket: unknown = null;
    let mounted = true;

    async function connect() {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      if (!token) return;

      setSocketStatus('connecting');
      pushEvent({ type: 'info', service: 'transporte', title: 'Conectando al servidor de eventos…' });

      try {
        const io = (await loadSocketIO()) as IoFn;
        if (!mounted) return;

        const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://api-gateway-780842550857.us-central1.run.app';

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        socket = (io as any)(API, {
          auth: { token },
          query: { token },
          transports: ['websocket', 'polling'],
          reconnectionAttempts: 10,
          reconnectionDelay: 2000,
        });

        socketRef.current = socket;
        const s = socket as SocketApi;

        s.on('connect', () => {
          if (!mounted) return;
          setSocketStatus('connected');
          s.emit('join:admin');
          pushEvent({ type: 'info', service: 'transporte', title: 'WebSocket conectado', subtitle: 'Recibiendo eventos en tiempo real' });
        });

        s.on('disconnect', () => {
          if (!mounted) return;
          setSocketStatus('disconnected');
          pushEvent({ type: 'info', service: 'transporte', title: 'WebSocket desconectado', subtitle: 'Intentando reconectar…' });
        });

        s.on('connect_error', () => {
          if (!mounted) return;
          setSocketStatus('error');
        });

        // Driver location updates
        const handleLocation = (data: unknown) => {
          if (!mounted) return;
          const d = data as LocationData;
          const id = d.driverId ?? d.id ?? '';
          const lat = d.lat ?? d.latitude ?? 0;
          const lng = d.lng ?? d.longitude ?? 0;
          setActiveDrivers(prev => {
            const idx = prev.findIndex(x => x.id === id);
            const updated = { id, name: d.name ?? `Conductor ${id.slice(-4)}`, lat, lng, status: d.status ?? 'online', lastUpdate: new Date() };
            if (idx >= 0) { const next = [...prev]; next[idx] = updated; return next; }
            return [...prev, updated];
          });
        };

        s.on('driverLocationUpdated', handleLocation);
        s.on('driver:location:updated', handleLocation);

        s.on('ride:driver_accepted', (data: unknown) => {
          if (!mounted) return;
          const d = data as RideData;
          pushEvent({
            type: 'ride_accepted',
            service: 'transporte',
            title: `Viaje aceptado por ${d.driverName ?? 'conductor'}`,
            subtitle: d.origin ? `${d.origin} → ${d.destination ?? '…'}` : undefined,
          });
        });

        s.on('ride:started', (data: unknown) => {
          if (!mounted) return;
          const d = data as RideData;
          pushEvent({
            type: 'ride_started',
            service: 'transporte',
            title: `Viaje iniciado`,
            subtitle: d.driverName ? `Conductor: ${d.driverName}` : undefined,
          });
        });

        s.on('ride:completed', (data: unknown) => {
          if (!mounted) return;
          const d = data as RideCompleteData;
          pushEvent({
            type: 'ride_completed',
            service: 'transporte',
            title: `Viaje completado`,
            subtitle: d.amount ? `Monto: $${d.amount}` : (d.driverName ? `Conductor: ${d.driverName}` : undefined),
          });
        });

        s.on('ride:cancelled', (data: unknown) => {
          if (!mounted) return;
          const d = data as CancelData;
          pushEvent({
            type: 'ride_cancelled',
            service: 'transporte',
            title: `Viaje cancelado`,
            subtitle: d.reason ?? undefined,
          });
        });

      } catch (err) {
        if (mounted) setSocketStatus('error');
        console.error('Socket connection failed:', err);
      }
    }

    connect();
    loadStats();

    const statsInterval = setInterval(loadStats, 30_000);

    return () => {
      mounted = false;
      clearInterval(statsInterval);
      if (socket) {
        (socket as Disconnectable).disconnect();
        socketRef.current = null;
      }
    };
  }, [loadStats, pushEvent]);

  // Filtered events
  const filteredEvents = filterService === 'all'
    ? liveEvents
    : liveEvents.filter(e => e.service === filterService);

  const totalActive = services.reduce((s, c) => s + c.active, 0);
  const driversOnline = activeDrivers.filter(d => {
    const mins = (Date.now() - d.lastUpdate.getTime()) / 60000;
    return mins < 5;
  }).length;

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Operaciones en vivo</h1>
          <p className="text-sm text-gray-500 mt-0.5">Vista unificada de todos los servicios en tiempo real</p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <StatusDot status={socketStatus} />
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
            <span>{driversOnline} conductor{driversOnline !== 1 ? 'es' : ''} en línea</span>
          </div>
          <button
            onClick={loadStats}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600"
          >
            ↻ Actualizar
          </button>
        </div>
      </div>

      {/* Service Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {services.map(svc => (
          <div
            key={svc.key}
            className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setFilterService(f => f === svc.key ? 'all' : svc.key)}
            style={filterService === svc.key ? { borderColor: svc.color, borderWidth: 2 } : undefined}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xl">{svc.icon}</span>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: svc.active > 0 ? svc.color : '#9ca3af' }}
              >
                {svc.active} activo{svc.active !== 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-sm font-semibold text-gray-800">{svc.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{svc.total} hoy en total</p>
          </div>
        ))}
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
          <p className="text-3xl font-black" style={{ color: '#ff4c41' }}>{totalActive}</p>
          <p className="text-xs text-gray-500 mt-1">Operaciones activas</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
          <p className="text-3xl font-black text-green-600">{driversOnline}</p>
          <p className="text-xs text-gray-500 mt-1">Conductores en línea</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
          <p className="text-3xl font-black text-blue-600">{liveEvents.length}</p>
          <p className="text-xs text-gray-500 mt-1">Eventos esta sesión</p>
        </div>
      </div>

      {/* Main 2-col layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Feed — 2/3 width */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col" style={{ height: 520 }}>
          {/* Feed header */}
          <div className="p-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
            <div>
              <h2 className="font-bold text-gray-900 text-sm">Feed de eventos</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {filteredEvents.length} evento{filteredEvents.length !== 1 ? 's' : ''}
                {filterService !== 'all' && ` · ${SERVICE_CONFIG[filterService].label}`}
              </p>
            </div>
            {/* Filter chips */}
            <div className="flex gap-1.5 flex-wrap justify-end">
              <button
                onClick={() => setFilterService('all')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-full transition-colors ${filterService === 'all' ? 'text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                style={filterService === 'all' ? { backgroundColor: '#011627' } : undefined}
              >
                Todos
              </button>
              {services.map(s => (
                <button
                  key={s.key}
                  onClick={() => setFilterService(f => f === s.key ? 'all' : s.key)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-full transition-colors"
                  style={filterService === s.key
                    ? { backgroundColor: s.color, color: '#fff' }
                    : { backgroundColor: '#f3f4f6', color: '#6b7280' }}
                >
                  {s.icon}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable feed */}
          <div ref={feedRef} className="flex-1 overflow-y-auto p-4">
            {filteredEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <span className="text-5xl mb-3">📡</span>
                <p className="font-medium">Esperando eventos…</p>
                <p className="text-xs mt-1">
                  {socketStatus === 'connected'
                    ? 'Conectado — los eventos aparecerán aquí'
                    : socketStatus === 'connecting'
                    ? 'Conectando al servidor…'
                    : 'WebSocket desconectado'}
                </p>
              </div>
            ) : (
              [...filteredEvents].reverse().map(ev => <EventRow key={ev.id} ev={ev} />)
            )}
          </div>
        </div>

        {/* Active Drivers — 1/3 width */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col" style={{ height: 520 }}>
          <div className="p-4 border-b border-gray-100 flex-shrink-0">
            <h2 className="font-bold text-gray-900 text-sm">Conductores activos</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {activeDrivers.length} detectado{activeDrivers.length !== 1 ? 's' : ''} · GPS en vivo
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {activeDrivers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <span className="text-4xl mb-2">🗺️</span>
                <p className="text-sm font-medium">Sin conductores detectados</p>
                <p className="text-xs mt-1 text-center">Los conductores aparecerán cuando emitan su GPS</p>
              </div>
            ) : (
              [...activeDrivers]
                .sort((a, b) => b.lastUpdate.getTime() - a.lastUpdate.getTime())
                .map(d => <DriverPin key={d.id} driver={d} />)
            )}
          </div>

          {/* Advisory */}
          <div className="p-3 flex-shrink-0 border-t border-gray-100">
            <div className="rounded-xl p-3 text-xs text-amber-700" style={{ backgroundColor: '#fffbeb' }}>
              <p className="font-semibold mb-0.5">💡 Datos en tiempo real</p>
              <p>Conductores con GPS activo en los últimos 5 min. Posiciones via WebSocket o polling cada 30s.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Services advisory */}
      <div className="mt-5 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex gap-3">
          <span className="text-lg flex-shrink-0">📡</span>
          <div>
            <p className="font-bold text-gray-900 text-sm mb-1">Cobertura de servicios</p>
            <p className="text-xs text-gray-500">
              <strong>Transporte:</strong> datos reales via WebSocket + <code className="bg-gray-100 px-1 rounded">/admin/stats/transport</code>.{' '}
              <strong>Envíos, Tours, Experiencias, Alojamientos:</strong> contadores en tiempo real estarán disponibles cuando el backend exponga{' '}
              <code className="bg-gray-100 px-1 rounded">/admin/stats/live</code> con breakdown por servicio.
              El feed de eventos ya está listo para recibir cualquier evento adicional que el backend emita via WebSocket.
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
