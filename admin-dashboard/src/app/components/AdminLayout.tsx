/**
 * Admin Layout Component - Wrapper with sidebar navigation
 */

'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@going-monorepo-clean/shared-ui';

interface AdminLayoutProps {
  children: React.ReactNode;
  onLogout?: () => void;
  userName?: string;
}

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: '📊' },
  { label: 'Usuarios', href: '/users', icon: '👥' },
  { label: 'Reservas', href: '/bookings', icon: '📅' },
  { label: 'Pagos', href: '/payments', icon: '💳' },
  { label: 'Analítica', href: '/analytics', icon: '📈' },
];

/**
 * Admin Layout with sidebar navigation
 * Provides consistent structure for all admin pages
 */
export function AdminLayout({
  children,
  onLogout,
  userName = 'Admin',
}: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const handleNavigation = (href: string) => {
    router.push(href);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 h-screen bg-white border-r border-gray-200
          transition-all duration-300
          ${sidebarOpen ? 'w-64' : 'w-20'}
          z-40
        `}
      >
        {/* Logo/Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          {sidebarOpen && (
            <h1 className="text-lg font-bold text-going-primary">Admin</h1>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? '❮' : '❯'}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.href}
              onClick={() => handleNavigation(item.href)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-lg
                transition-colors text-left
                ${
                  pathname === item.href
                    ? 'bg-going-primary text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }
              `}
              title={!sidebarOpen ? item.label : undefined}
            >
              <span className="text-lg">{item.icon}</span>
              {sidebarOpen && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* User Section */}
        <div className="border-t border-gray-200 p-4 space-y-3">
          {sidebarOpen && (
            <div className="px-2">
              <p className="text-sm text-gray-600">Conectado como:</p>
              <p className="font-semibold text-gray-900">{userName}</p>
            </div>
          )}
          {onLogout && (
            <Button
              variant="ghost"
              className="w-full text-sm"
              onClick={onLogout}
            >
              {sidebarOpen ? '🚪 Cerrar Sesión' : '🚪'}
            </Button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`
          transition-all duration-300
          ${sidebarOpen ? 'ml-64' : 'ml-20'}
        `}
      >
        {/* Top Bar */}
        <div className="h-16 bg-white border-b border-gray-200 flex items-center px-8 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900">
            Panel de Administración
          </h2>
        </div>

        {/* Content */}
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
