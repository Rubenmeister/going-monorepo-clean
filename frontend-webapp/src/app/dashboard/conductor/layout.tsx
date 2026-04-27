'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  authFetch,
  clearStoredAuth,
  getStoredToken,
  parseJwtPayload,
  redirectToLogin,
} from '@/lib/providers/auth-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api-gateway-780842550857.us-central1.run.app';

interface DriverInfo {
  id: string;
  firstName: string;
  lastName?: string;
  email?: string;
  roles: string[];
  rating?: number;
  vehiclePlate?: string;
}

const NAV = [
  { icon: '🏠', label: 'Inicio',         href: '/dashboard/conductor' },
  { icon: '🕐', label: 'Historial',      href: '/dashboard/conductor/historial' },
  { icon: '💰', label: 'Ganancias',      href: '/dashboard/conductor/ganancias' },
  { icon: '⭐', label: 'Calificaciones', href: '/dashboard/conductor/calificaciones' },
  { icon: '📄', label: 'Documentos',     href: '/dashboard/conductor/documentos' },
  { icon: '👤', label: 'Perfil',         href: '/dashboard/conductor/perfil' },
];

export default function ConductorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [driver, setDriver]               = useState<DriverInfo | null>(null);
  const [todayEarnings, setTodayEarnings] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen]     = useState(false);
  const [userMenuOpen, setUserMenuOpen]   = useState(false);

  // Auth gate — token + role check
  useEffect(() => {
    const token = getStoredToken();
    if (!token) { redirectToLogin('/dashboard/conductor'); return; }
    const payload = parseJwtPayload<{
      sub?: string; userId?: string;
      firstName?: string; lastName?: string; name?: string;
      email?: string; roles?: string[]; role?: string;
      rating?: number; vehiclePlate?: string;
    }>(token);
    if (!payload) { redirectToLogin('/dashboard/conductor'); return; }
    const roles = Array.isArray(payload.roles)
      ? payload.roles
      : payload.role ? [payload.role] : [];
    if (!roles.includes('driver')) { router.replace('/dashboard/pasajero'); return; }

    setDriver({
      id:        (payload.sub ?? payload.userId ?? '') as string,
      firstName: payload.firstName ?? payload.name?.split(' ')[0] ?? 'Conductor',
      lastName:  payload.lastName,
      email:     payload.email,
      roles,
      rating:    payload.rating,
      vehiclePlate: payload.vehiclePlate,
    });
  }, [router]);

  // Fetch ganancias del día (rellena la card del sidebar)
  useEffect(() => {
    if (!driver) return;
    authFetch(`${API_URL}/drivers/me/stats/today`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setTodayEarnings(d.earnings ?? 0); })
      .catch(() => {});
  }, [driver]);

  const logout = async () => {
    await clearStoredAuth();
    window.location.href = '/';
  };

  if (!driver) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#0033A0] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const initials = `${driver.firstName[0] ?? 'C'}${driver.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* ── Navbar superior ── */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(o => !o)}
              className="lg:hidden w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
              aria-label="Menú"
            >
              ☰
            </button>
            <Link href="/dashboard/conductor">
              <Image src="/going-logo-h.png" alt="Going" width={110} height={36} className="h-8 w-auto object-contain" priority />
            </Link>
            <span className="hidden sm:inline-block text-xs bg-blue-100 text-[#0033A0] px-2.5 py-1 rounded-full font-bold">
              Conductor
            </span>
          </div>

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
                {driver.firstName}
              </span>
              <span className="text-gray-400 text-xs">▾</span>
            </button>

            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-20">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {driver.firstName} {driver.lastName ?? ''}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{driver.email}</p>
                  </div>
                  <Link href="/dashboard/conductor/perfil"
                    className="flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <span>👤</span> Mi perfil
                  </Link>
                  <button onClick={logout}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors">
                    <span>🚪</span> Cerrar sesión
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Layout ── */}
      <div className="flex flex-1 max-w-screen-xl mx-auto w-full">

        {sidebarOpen && (
          <div className="fixed inset-0 z-20 lg:hidden" onClick={() => setSidebarOpen(false)}>
            <div className="absolute inset-0 bg-black/40" />
          </div>
        )}

        {/* Sidebar */}
        <aside className={`
          fixed lg:sticky top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-100 z-20
          flex flex-col transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}>
          {/* Conductor info */}
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #0033A0, #ff4c41)' }}>
                {initials}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-gray-900 truncate">{driver.firstName} {driver.lastName ?? ''}</p>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <span className="text-yellow-500">⭐</span>
                  <span>{driver.rating?.toFixed(1) ?? '—'}</span>
                  {driver.vehiclePlate && (
                    <>
                      <span className="text-gray-300">·</span>
                      <span className="font-mono">{driver.vehiclePlate}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Ganancias hoy — card */}
          <div className="mx-4 my-3 rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, #0033A0, #001f6b)' }}>
            <p className="text-white/60 text-xs mb-1">Ganado hoy</p>
            <p className="text-white text-2xl font-bold">
              {todayEarnings !== null ? `$${todayEarnings.toFixed(2)}` : '—'}
            </p>
            <Link href="/dashboard/conductor/ganancias"
              className="inline-block mt-3 text-xs font-bold bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg transition-colors">
              Ver detalle →
            </Link>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-2 overflow-y-auto">
            {NAV.map(item => (
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

          <div className="p-4 border-t border-gray-100">
            <button onClick={logout}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-gray-500 hover:bg-gray-100 text-sm transition-colors">
              🚪 Cerrar sesión
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0 px-4 lg:px-8 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
