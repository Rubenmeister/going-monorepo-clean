'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api-gateway-780842550857.us-central1.run.app';

interface DriverInfo {
  id: string;
  firstName: string;
  lastName?: string;
  email?: string;
  roles: string[];
}

interface Trip {
  _id: string;
  status: string;
  origin?: { address: string };
  destination?: { address: string };
  fare?: number;
  createdAt?: string;
  passengerName?: string;
}

function parseJwt(token: string): DriverInfo | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const p = JSON.parse(atob(base64));
    return {
      id: p.sub || p.userId || '',
      firstName: p.firstName || p.name || 'Conductor',
      lastName: p.lastName,
      email: p.email,
      roles: Array.isArray(p.roles) ? p.roles : [],
    };
  } catch { return null; }
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending:     { label: 'Esperando pasajero', color: '#f59e0b' },
  accepted:    { label: 'Pasajero asignado',  color: '#0033A0' },
  in_progress: { label: 'En curso',           color: '#16a34a' },
  completed:   { label: 'Completado',         color: '#6b7280' },
  cancelled:   { label: 'Cancelado',          color: '#ef4444' },
};

const SIDEBAR_NAV = [
  { icon: '🏠', label: 'Inicio',         href: '/conductores/panel', active: true },
  { icon: '🗺️', label: 'Viajes activos', href: '/conductores/viajes' },
  { icon: '🕐', label: 'Historial',      href: '/conductores/historial' },
  { icon: '💰', label: 'Mis ganancias',  href: '/conductores/ganancias' },
  { icon: '⭐', label: 'Calificaciones', href: '/conductores/calificaciones' },
  { icon: '📚', label: 'Academia',       href: '/academy' },
  { icon: '⚙️', label: 'Mi cuenta',      href: '/account' },
];

export default function DriverDashboard() {
  const [driver, setDriver]           = useState<DriverInfo | null>(null);
  const [trips, setTrips]             = useState<Trip[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isOnline, setIsOnline]       = useState(false);

  // KPI state (mock until real API)
  const [earnings] = useState({ today: 48.5, week: 284.0, month: 1126.0 });
  const [rating]   = useState(4.87);
  const [tripsCount] = useState({ today: 4, week: 23, total: 312 });

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) { window.location.href = '/auth/login?from=/conductores/panel'; return; }
    const decoded = parseJwt(token);
    if (!decoded) { window.location.href = '/auth/login'; return; }
    setDriver(decoded);

    // Load recent trips
    fetch(`${API_URL}/rides/driver/history?limit=5`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : { rides: [] })
      .then(d => setTrips(Array.isArray(d.rides) ? d.rides : []))
      .catch(() => setTrips([]))
      .finally(() => setLoadingTrips(false));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    document.cookie = 'going_webapp_session=; path=/; max-age=0';
    window.location.href = '/';
  };

  if (!driver) return null;

  const initials = `${driver.firstName[0]}${driver.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* ── Sidebar ─────────────────────────────────── */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#011627] flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:flex`}>
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <Link href="/" className="text-2xl font-black" style={{ color: '#ff4c41' }}>Going</Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white text-xl">✕</button>
        </div>

        {/* Driver profile */}
        <div className="px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}>
              {initials}
            </div>
            <div>
              <p className="text-white text-sm font-bold">{driver.firstName} {driver.lastName}</p>
              <p className="text-gray-400 text-xs truncate">{driver.email}</p>
            </div>
          </div>
          {/* Online toggle */}
          <button
            onClick={() => setIsOnline(v => !v)}
            className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold transition-all ${isOnline ? 'bg-green-500 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
          >
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-white animate-pulse' : 'bg-gray-500'}`} />
            {isOnline ? 'En línea' : 'Conectarme'}
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {SIDEBAR_NAV.map(item => (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${item.active ? 'bg-white/15 text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}>
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="px-6 pb-6">
          <button onClick={handleLogout} className="w-full text-xs text-gray-500 hover:text-red-400 transition-colors py-2">
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Overlay mobile */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* ── Main content ─────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-600 text-xl mr-3">☰</button>
          <div>
            <h1 className="font-black text-gray-900 text-base">Panel del conductor</h1>
            <p className="text-xs text-gray-400">Bienvenido, {driver.firstName}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${isOnline ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {isOnline ? '🟢 En línea' : '⚫ Fuera de línea'}
            </span>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}>
              {initials}
            </div>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-6 overflow-y-auto">

          {/* Online CTA */}
          {!isOnline && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-5 mb-6 flex items-center justify-between">
              <div>
                <p className="font-bold text-green-900 text-sm">¿Listo para conducir?</p>
                <p className="text-green-700 text-xs mt-0.5">Conéctate para empezar a recibir solicitudes de viaje</p>
              </div>
              <button onClick={() => setIsOnline(true)}
                className="px-5 py-2.5 text-white font-bold rounded-xl text-sm transition-all hover:opacity-90"
                style={{ backgroundColor: '#16a34a' }}>
                Conectarme →
              </button>
            </div>
          )}

          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Ganancias hoy',   value: `$${earnings.today.toFixed(2)}`,  color: '#16a34a', icon: '💰' },
              { label: 'Esta semana',     value: `$${earnings.week.toFixed(2)}`,   color: '#0033A0', icon: '📅' },
              { label: 'Este mes',        value: `$${earnings.month.toFixed(2)}`,  color: '#7c3aed', icon: '📊' },
              { label: 'Calificación',    value: `⭐ ${rating}`,                   color: '#f59e0b', icon: '⭐' },
            ].map(k => (
              <div key={k.label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <p className="text-xs text-gray-500">{k.label}</p>
                <p className="text-xl font-black mt-1" style={{ color: k.color }}>{k.value}</p>
              </div>
            ))}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Viajes hoy',   value: tripsCount.today },
              { label: 'Esta semana',  value: tripsCount.week },
              { label: 'Total viajes', value: tripsCount.total },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
                <p className="text-2xl font-black text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Recent trips */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6">
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h2 className="font-bold text-gray-900 text-sm">Últimos viajes</h2>
              <Link href="/conductores/historial" className="text-xs font-semibold" style={{ color: '#ff4c41' }}>
                Ver todos →
              </Link>
            </div>

            {loadingTrips ? (
              <div className="p-8 text-center text-gray-400 text-sm">Cargando...</div>
            ) : trips.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-3xl mb-2">🚗</p>
                <p className="text-gray-400 text-sm">Aún no tienes viajes registrados.</p>
                <p className="text-gray-300 text-xs mt-1">Conéctate para empezar a recibir solicitudes.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {trips.map(trip => {
                  const st = STATUS_LABEL[trip.status] ?? { label: trip.status, color: '#6b7280' };
                  return (
                    <div key={trip._id} className="px-5 py-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gray-50 text-xl">
                        🚗
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {trip.origin?.address ?? 'Origen'} → {trip.destination?.address ?? 'Destino'}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {trip.passengerName ?? 'Pasajero'} · {trip.createdAt ? new Date(trip.createdAt).toLocaleDateString('es-EC') : ''}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ backgroundColor: `${st.color}20`, color: st.color }}>
                          {st.label}
                        </span>
                        {trip.fare !== undefined && (
                          <p className="text-sm font-black text-gray-900 mt-1">${trip.fare.toFixed(2)}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: '🗺️', label: 'Viajes activos',  href: '/conductores/viajes',        bg: '#0033A0' },
              { icon: '💰', label: 'Mis ganancias',   href: '/conductores/ganancias',     bg: '#16a34a' },
              { icon: '⭐', label: 'Calificaciones',  href: '/conductores/calificaciones',bg: '#f59e0b' },
              { icon: '📚', label: 'Academia Going',  href: '/academy',                   bg: '#7c3aed' },
            ].map(a => (
              <Link key={a.href} href={a.href}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-3"
                  style={{ backgroundColor: `${a.bg}15` }}>
                  {a.icon}
                </div>
                <p className="text-sm font-semibold text-gray-900">{a.label}</p>
              </Link>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
