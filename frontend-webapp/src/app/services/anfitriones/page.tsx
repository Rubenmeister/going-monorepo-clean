'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface HostInfo {
  id: string;
  firstName: string;
  lastName?: string;
  email?: string;
  roles: string[];
}

function parseJwt(token: string): HostInfo | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const p = JSON.parse(atob(base64));
    return {
      id: p.sub || p.userId || '',
      firstName: p.firstName || p.name || 'Anfitrión',
      lastName: p.lastName,
      email: p.email,
      roles: Array.isArray(p.roles) ? p.roles : [],
    };
  } catch { return null; }
}

const SIDEBAR_NAV = [
  { icon: '🏠', label: 'Inicio',        href: '/services/anfitriones', active: true },
  { icon: '🏡', label: 'Mis espacios',  href: '/services/anfitriones/espacios' },
  { icon: '📅', label: 'Reservas',      href: '/services/anfitriones/reservas' },
  { icon: '💳', label: 'Ganancias',     href: '/services/anfitriones/ganancias' },
  { icon: '⭐', label: 'Reseñas',       href: '/services/anfitriones/resenas' },
  { icon: '⚙️', label: 'Mi cuenta',     href: '/account' },
];

export default function AnfitrionesPanel() {
  const [user, setUser] = useState<HostInfo | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) { window.location.href = '/auth/login?from=/services/anfitriones'; return; }
    const decoded = parseJwt(token);
    if (!decoded) { window.location.href = '/auth/login'; return; }
    setUser(decoded);
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
        <div className="w-8 h-8 border-4 border-[#7c3aed] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const initials = `${user.firstName[0]}${user.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* NAVBAR */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(o => !o)}
              className="lg:hidden w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200">☰</button>
            <Link href="/services/anfitriones">
              <span className="text-xl font-black" style={{ color: '#7c3aed' }}>🏡 Going Anfitriones</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
              {initials}
            </div>
            <span className="hidden sm:block text-sm font-semibold text-gray-800">{user.firstName}</span>
            <button onClick={logout} className="text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1">Salir</button>
          </div>
        </div>
      </nav>

      <div className="flex flex-1 max-w-screen-xl mx-auto w-full">

        {/* SIDEBAR OVERLAY */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-20 lg:hidden" onClick={() => setSidebarOpen(false)}>
            <div className="absolute inset-0 bg-black/40" />
          </div>
        )}

        {/* SIDEBAR */}
        <aside className={`fixed lg:sticky top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-100 z-20 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg font-bold"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
                {initials}
              </div>
              <div>
                <p className="font-bold text-gray-900">{user.firstName} {user.lastName ?? ''}</p>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold text-white" style={{ backgroundColor: '#7c3aed' }}>Anfitrión</span>
              </div>
            </div>
          </div>
          <nav className="flex-1 px-3 py-2 overflow-y-auto">
            {SIDEBAR_NAV.map(item => (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-sm font-medium transition-colors ${
                  item.active ? 'text-white font-bold' : 'text-gray-600 hover:bg-gray-100'
                }`}
                style={item.active ? { backgroundColor: '#7c3aed' } : {}}>
                <span>{item.icon}</span>{item.label}
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t border-gray-100">
            <button onClick={logout} className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-gray-500 hover:bg-gray-100 text-sm">
              🚪 Cerrar sesión
            </button>
          </div>
        </aside>

        {/* CONTENIDO */}
        <main className="flex-1 min-w-0 px-4 lg:px-8 py-6 space-y-6">

          <div>
            <h1 className="text-2xl font-black text-gray-900">Hola, {user.firstName} 👋</h1>
            <p className="text-gray-400 text-sm mt-0.5">Gestiona tus espacios y reservas</p>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Este mes', value: '$—', icon: '💰', color: '#7c3aed' },
              { label: 'Reservas activas', value: '—', icon: '📅', color: '#0033A0' },
              { label: 'Calificación', value: '—', icon: '⭐', color: '#f59e0b' },
              { label: 'Espacios publicados', value: '—', icon: '🏡', color: '#16a34a' },
            ].map(kpi => (
              <div key={kpi.label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <p className="text-xs text-gray-400 font-semibold mb-1">{kpi.label}</p>
                <p className="text-3xl font-black" style={{ color: kpi.color }}>{kpi.value}</p>
                <p className="text-xl mt-1">{kpi.icon}</p>
              </div>
            ))}
          </div>

          {/* Acciones rápidas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: '➕', label: 'Publicar espacio', href: '/services/anfitriones/espacios/nuevo' },
              { icon: '📅', label: 'Ver reservas',     href: '/services/anfitriones/reservas' },
              { icon: '💳', label: 'Mis ganancias',    href: '/services/anfitriones/ganancias' },
              { icon: '⭐', label: 'Reseñas',          href: '/services/anfitriones/resenas' },
            ].map(a => (
              <Link key={a.label} href={a.href}
                className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col items-center gap-2 hover:shadow-md transition-all text-center">
                <span className="text-2xl">{a.icon}</span>
                <span className="text-xs font-semibold text-gray-700">{a.label}</span>
              </Link>
            ))}
          </div>

          {/* Próximas reservas */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Próximas reservas</h3>
            <div className="text-center py-8">
              <p className="text-4xl mb-2">🏡</p>
              <p className="text-gray-400 text-sm">Aún no tienes reservas próximas.</p>
              <Link href="/services/anfitriones/espacios/nuevo"
                className="inline-block mt-3 text-sm font-bold underline" style={{ color: '#7c3aed' }}>
                Publicar mi primer espacio →
              </Link>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
