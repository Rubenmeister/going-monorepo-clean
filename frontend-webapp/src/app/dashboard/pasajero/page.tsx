'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api-gateway-780842550857.us-central1.run.app';

interface UserInfo {
  id: string;
  firstName: string;
  lastName?: string;
  email?: string;
  roles: string[];
}

interface Ride {
  _id: string;
  status: string;
  origin?: { address: string };
  destination?: { address: string };
  fare?: number;
  createdAt?: string;
}

function parseJwt(token: string): UserInfo | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const p = JSON.parse(atob(base64));
    return {
      id: p.sub || p.userId || '',
      firstName: p.firstName || p.name || 'Usuario',
      lastName: p.lastName,
      email: p.email,
      roles: Array.isArray(p.roles) ? p.roles : [],
    };
  } catch { return null; }
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending:     { label: 'Buscando conductor', color: '#f59e0b' },
  accepted:    { label: 'Conductor asignado', color: '#0033A0' },
  in_progress: { label: 'En curso',           color: '#16a34a' },
  completed:   { label: 'Completado',         color: '#6b7280' },
  cancelled:   { label: 'Cancelado',          color: '#ef4444' },
};

const NAV_SERVICES = [
  { label: 'Transporte', href: '/ride' },
  { label: 'Alojamiento', href: '/services/accommodation' },
  { label: 'Tours', href: '/services/tours' },
  { label: 'Experiencias', href: '/services/experiences' },
  { label: 'Envíos', href: '/envios' },
  { label: 'Empresas', href: '/empresas' },
];

const SIDEBAR_NAV = [
  { icon: '🏠', label: 'Inicio',     href: '/dashboard/pasajero' },
  { icon: '🚗', label: 'Pedir viaje',href: '/ride' },
  { icon: '🕐', label: 'Historial',  href: '/ride/historial' },
  { icon: '💳', label: 'Wallet',     href: '/payment/wallet' },
  { icon: '📦', label: 'Envíos',     href: '/envios' },
  { icon: '🏨', label: 'Alojamiento',href: '/services/accommodation' },
  { icon: '⚙️', label: 'Mi cuenta',  href: '/account' },
];

export default function PassengerDashboard() {
  const pathname                  = usePathname();
  const [user, setUser]           = useState<UserInfo | null>(null);
  const [rides, setRides]         = useState<Ride[]>([]);
  const [loadingRides, setLoadingRides] = useState(true);
  const [walletBalance]           = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) { window.location.href = '/auth/login?from=/dashboard/pasajero'; return; }
    const decoded = parseJwt(token);
    if (!decoded) { window.location.href = '/auth/login'; return; }
    setUser(decoded);

    fetch(`${API_URL}/transport/user/${decoded.id}/history`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => setRides(Array.isArray(data) ? data.slice(0, 5) : []))
      .catch(() => setRides([]))
      .finally(() => setLoadingRides(false));
  }, []);

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    document.cookie = 'going_webapp_session=; path=/; max-age=0';
    window.location.href = '/';
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#ff4c41] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const initials = `${user.firstName[0]}${user.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* ══════════════════ NAVBAR SUPERIOR ══════════════════ */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-4 h-16 flex items-center justify-between gap-4">

          {/* Logo + hamburger */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(o => !o)}
              className="lg:hidden w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
              aria-label="Menú"
            >
              ☰
            </button>
            <Link href="/dashboard/pasajero">
              <Image src="/going-logo-h.png" alt="Going" width={110} height={36} className="h-8 w-auto object-contain" priority />
            </Link>
          </div>

          {/* Servicios — desktop */}
          <div className="hidden lg:flex items-center gap-1">
            {NAV_SERVICES.map(s => (
              <Link key={s.label} href={s.href}
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:text-[#0033A0] hover:bg-blue-50 transition-colors">
                {s.label}
              </Link>
            ))}
          </div>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(o => !o)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #0033A0, #ff4c41)' }}>
                {initials}
              </div>
              <span className="hidden sm:block text-sm font-semibold text-gray-800 max-w-[120px] truncate">
                {user.firstName}
              </span>
              <span className="text-gray-400 text-xs">▾</span>
            </button>

            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-20">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-bold text-gray-900 truncate">{user.firstName} {user.lastName ?? ''}</p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  </div>
                  <Link href="/account" className="flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <span>⚙️</span> Mi cuenta
                  </Link>
                  <Link href="/payment/wallet" className="flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <span>💳</span> Wallet
                  </Link>
                  <button onClick={logout} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors">
                    <span>🚪</span> Cerrar sesión
                  </button>
                </div>
              </>
            )}
          </div>

        </div>
      </nav>

      {/* ══════════════════ LAYOUT PRINCIPAL ══════════════════ */}
      <div className="flex flex-1 max-w-screen-xl mx-auto w-full">

        {/* ── SIDEBAR OVERLAY (móvil) ── */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-20 lg:hidden" onClick={() => setSidebarOpen(false)}>
            <div className="absolute inset-0 bg-black/40" />
          </div>
        )}

        {/* ── SIDEBAR ── */}
        <aside className={`
          fixed lg:sticky top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-100 z-20
          flex flex-col transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}>
          {/* Usuario */}
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #0033A0, #ff4c41)' }}>
                {initials}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-gray-900 truncate">{user.firstName} {user.lastName ?? ''}</p>
                <span className="text-xs bg-blue-100 text-[#0033A0] px-2 py-0.5 rounded-full font-semibold">Pasajero</span>
              </div>
            </div>
          </div>

          {/* Wallet */}
          <div className="mx-4 my-3 rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, #0033A0, #001f6b)' }}>
            <p className="text-white/60 text-xs mb-1">Going Wallet</p>
            <p className="text-white text-2xl font-bold">
              {walletBalance !== null ? `$${walletBalance.toFixed(2)}` : '—'}
            </p>
            <Link href="/payment/wallet"
              className="inline-block mt-3 text-xs font-bold bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg transition-colors">
              + Recargar
            </Link>
          </div>

          {/* Navegación */}
          <nav className="flex-1 px-3 py-2 overflow-y-auto">
            {SIDEBAR_NAV.map(item => (
              <Link key={item.href} href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? 'bg-blue-50 text-[#0033A0] font-bold'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}>
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>

          {/* SOS + Salir */}
          <div className="p-4 border-t border-gray-100 space-y-2">
            <Link href="/sos"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-red-50 border-2 border-red-200 text-red-600 font-bold text-sm hover:bg-red-100 transition-colors">
              🆘 SOS — Emergencia
            </Link>
            <button onClick={logout}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-gray-500 hover:bg-gray-100 text-sm transition-colors">
              🚪 Cerrar sesión
            </button>
          </div>
        </aside>

        {/* ══════════════════ CONTENIDO PRINCIPAL ══════════════════ */}
        <main className="flex-1 min-w-0 px-4 lg:px-8 py-6 space-y-6">

          {/* Saludo */}
          <div>
            <h1 className="text-2xl font-black text-gray-900">
              Hola, {user.firstName} 👋
            </h1>
            <p className="text-gray-400 text-sm mt-0.5">¿A dónde viajas hoy?</p>
          </div>

          {/* ── Pedir viaje — card principal ── */}
          <Link href="/ride"
            className="block rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-all active:scale-[0.99] group"
            style={{ background: 'linear-gradient(135deg, #FFCD00 0%, #FFE066 100%)' }}>
            <div className="p-6 flex items-center justify-between">
              <div>
                <p className="text-[#0033A0] text-xs font-bold uppercase tracking-widest mb-1">Transporte</p>
                <h2 className="text-3xl font-black text-[#0033A0] leading-tight">Pedir un viaje</h2>
                <p className="text-[#0033A0]/70 text-sm mt-2">Rápido, seguro y rastreable en tiempo real</p>
                <div className="mt-4 inline-flex items-center gap-1 bg-[#0033A0] text-white text-sm font-bold px-4 py-2 rounded-xl">
                  Buscar viaje →
                </div>
              </div>
              <div className="w-24 h-24 bg-[#0033A0] rounded-3xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform ml-4">
                <span className="text-5xl">🚗</span>
              </div>
            </div>
          </Link>

          {/* ── Grid de acciones rápidas ── */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {[
              { icon: '💳', label: 'Wallet',      href: '/payment/wallet',         color: '#0033A0' },
              { icon: '🕐', label: 'Historial',   href: '/ride/historial',          color: '#0033A0' },
              { icon: '🆘', label: 'SOS',         href: '/sos',                     color: '#ef4444' },
              { icon: '📦', label: 'Envíos',      href: '/envios',                  color: '#f59e0b' },
              { icon: '🏨', label: 'Alojamiento', href: '/services/accommodation',  color: '#8b5cf6' },
              { icon: '🗺️', label: 'Tours',       href: '/services/tours',          color: '#10b981' },
            ].map(item => (
              <Link key={item.label} href={item.href}
                className="bg-white rounded-2xl p-3 border border-gray-100 hover:shadow-md transition-all flex flex-col items-center gap-2 text-center group">
                <span className="text-2xl">{item.icon}</span>
                <span className="text-xs font-semibold text-gray-600">{item.label}</span>
              </Link>
            ))}
          </div>

          {/* ── Últimos viajes ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Últimos viajes</h3>
              <Link href="/ride/historial" className="text-xs text-[#0033A0] font-semibold hover:underline">Ver todos →</Link>
            </div>

            {loadingRides ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-[#0033A0] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : rides.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                <p className="text-4xl mb-2">🚕</p>
                <p className="text-gray-400 text-sm">Aún no tienes viajes. ¡Pide el primero!</p>
                <Link href="/ride" className="inline-block mt-3 text-sm font-bold text-[#0033A0] underline">
                  Pedir viaje →
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {rides.map(ride => {
                  const s = STATUS_LABEL[ride.status] ?? { label: ride.status, color: '#6b7280' };
                  const date = ride.createdAt
                    ? new Date(ride.createdAt).toLocaleDateString('es-EC', { day: 'numeric', month: 'short' })
                    : '';
                  return (
                    <div key={ride._id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 hover:shadow-sm transition-shadow">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-xl flex-shrink-0">🚗</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {ride.destination?.address ?? 'Destino desconocido'}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {ride.origin?.address ?? ''}{date ? ` · ${date}` : ''}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-gray-900">
                          {ride.fare ? `$${ride.fare.toFixed(2)}` : '—'}
                        </p>
                        <span className="text-xs font-medium" style={{ color: s.color }}>{s.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </main>
      </div>

      {/* ══════════════════ BOTTOM NAV — SOLO MÓVIL ══════════════════ */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-20 shadow-lg">
        <div className="grid grid-cols-5 h-16">
          {[
            { icon: '🏠', label: 'Inicio',    href: '/dashboard/pasajero' },
            { icon: '🚗', label: 'Viaje',     href: '/ride' },
            { icon: '💳', label: 'Wallet',    href: '/payment/wallet' },
            { icon: '🕐', label: 'Historial', href: '/ride/historial' },
            { icon: '🆘', label: 'SOS',       href: '/sos' },
          ].map(item => (
            <Link key={item.href} href={item.href}
              className="flex flex-col items-center justify-center gap-0.5 text-gray-500 hover:text-[#0033A0] transition-colors">
              <span className="text-xl">{item.icon}</span>
              <span className="text-[10px] font-semibold">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Padding para bottom nav en móvil */}
      <div className="lg:hidden h-16" />

    </div>
  );
}
