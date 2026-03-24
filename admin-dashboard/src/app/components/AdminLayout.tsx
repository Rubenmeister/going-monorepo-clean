'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface AdminLayoutProps {
  children: React.ReactNode;
  onLogout?: () => void;
  userName?: string;
}

const NAV_SECTIONS = [
  {
    title: 'Principal',
    items: [{ label: 'Dashboard', href: '/', icon: '📊' }],
  },
  {
    title: 'Operaciones',
    items: [
      { label: 'Conductores',  href: '/drivers',   icon: '🚗' },
      { label: 'Vehículos',    href: '/vehicles',  icon: '🚙' },
      { label: 'Reservas',     href: '/bookings',  icon: '📅' },
    ],
  },
  {
    title: 'Proveedores',
    items: [
      { label: 'Anfitriones', href: '/hosts', icon: '🏨' },
    ],
  },
  {
    title: 'Clientes',
    items: [
      { label: 'Clientes App', href: '/clients',   icon: '👤' },
      { label: 'Empresas',     href: '/companies', icon: '🏢' },
      { label: 'Usuarios',     href: '/users',     icon: '👥' },
    ],
  },
  {
    title: 'Finanzas',
    items: [
      { label: 'Ingresos', href: '/ingresos', icon: '💰' },
      { label: 'Pagos',    href: '/payments', icon: '💳' },
    ],
  },
  {
    title: 'Análisis',
    items: [{ label: 'Analítica', href: '/analytics', icon: '📈' }],
  },
];

export function AdminLayout({
  children,
  onLogout,
  userName = 'Admin',
}: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen flex flex-col transition-all duration-300 z-40 ${
          sidebarOpen ? 'w-64' : 'w-16'
        }`}
        style={{ backgroundColor: '#011627' }}
      >
        {/* Logo */}
        <div
          className="flex items-center justify-between h-16 px-4 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
        >
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight" style={{ color: '#ff4c41' }}>
                Going
              </span>
              <span className="text-xs font-semibold text-white/50 uppercase tracking-widest">
                Admin
              </span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors ml-auto"
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-4">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title}>
              {sidebarOpen && (
                <p className="text-xs font-semibold text-white/30 uppercase tracking-wider px-3 mb-1">
                  {section.title}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <button
                      key={item.href}
                      onClick={() => router.push(item.href)}
                      title={!sidebarOpen ? item.label : undefined}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left text-sm font-medium ${
                        isActive ? 'text-white' : 'text-white/60 hover:text-white hover:bg-white/8'
                      }`}
                      style={isActive ? { backgroundColor: '#ff4c41' } : undefined}
                    >
                      <span className="text-base flex-shrink-0">{item.icon}</span>
                      {sidebarOpen && <span>{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User */}
        <div className="p-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          {sidebarOpen && (
            <div className="px-3 py-2 mb-2">
              <p className="text-xs text-white/40">Conectado como</p>
              <p className="text-sm font-semibold text-white truncate">{userName}</p>
            </div>
          )}
          {onLogout && (
            <button
              onClick={onLogout}
              title={!sidebarOpen ? 'Cerrar Sesión' : undefined}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-all text-sm"
            >
              <span className="flex-shrink-0">🚪</span>
              {sidebarOpen && <span>Cerrar Sesión</span>}
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div
        className="flex-1 flex flex-col min-h-screen transition-all duration-300"
        style={{ marginLeft: sidebarOpen ? '16rem' : '4rem' }}
      >
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-8 shadow-sm flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#ff4c41' }} />
            <h2 className="text-lg font-bold text-gray-900">Panel de Administración</h2>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm text-gray-500">{userName}</span>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ backgroundColor: '#ff4c41' }}
            >
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
