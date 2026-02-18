'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';
import Link from 'next/link';

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const navItems: NavItem[] = [
  { label: 'Inicio', href: '/', icon: '🏠' },
  { label: 'Servicios', href: '/services', icon: '🚗' },
  { label: 'Mi Cuenta', href: '/account', icon: '👤' },
  { label: 'Mis Reservas', href: '/bookings', icon: '🎫' },
  { label: 'Academia', href: '/academy', icon: '📚' },
  { label: 'SOS', href: '/sos', icon: '🚨' },
];

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { auth } = useMonorepoApp();

  const handleNavigation = (href: string) => {
    router.push(href);
    setIsOpen(false);
  };

  const handleLogout = async () => {
    await auth.logout?.();
    router.push('/auth/login');
    setIsOpen(false);
  };

  const isActive = (href: string) => pathname === href;

  return (
    <>
      {/* Hamburger Button - Visible on Mobile */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 md:hidden bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-all shadow-lg"
        title="Menú"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Overlay - Click to Close */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 h-screen w-64 bg-white shadow-xl z-40
          transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          md:translate-x-0 md:relative
          flex flex-col overflow-hidden
        `}
      >
        {/* Close Button - Mobile Only */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 z-50 md:hidden text-gray-500 hover:text-gray-700"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Logo Section */}
        <div className="p-6 border-b border-gray-200">
          <div className="text-4xl font-bold text-blue-600 text-center mb-2">🌍</div>
          <h1 className="text-2xl font-bold text-blue-600 text-center">Going</h1>
          <p className="text-xs text-gray-600 text-center mt-1">Plataforma de Viajes</p>
        </div>

        {/* User Info Card */}
        {auth.user ? (
          <div className="p-4 border-b border-gray-200 bg-blue-50">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {auth.user.firstName?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate text-sm">
                  {auth.user.firstName}
                </p>
                <p className="text-xs text-gray-600 truncate">
                  {auth.user.email}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Navigation Menu */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.href}
              onClick={() => handleNavigation(item.href)}
              className={`
                w-full text-left px-4 py-3 rounded-lg transition-all duration-200
                flex items-center space-x-3 font-medium
                ${
                  isActive(item.href)
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-100'
                }
              `}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          {auth.user ? (
            <>
              <p className="text-xs text-gray-600 mb-3 px-2">Cuenta</p>
              <button
                onClick={handleLogout}
                className="w-full px-4 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-semibold text-sm flex items-center justify-center space-x-2"
              >
                <span>🚪</span>
                <span>Cerrar Sesión</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => handleNavigation('/auth/login')}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm"
            >
              Iniciar Sesión
            </button>
          )}
          <p className="text-xs text-gray-500 text-center mt-4">
            © 2026 Going Ecuador
          </p>
        </div>
      </aside>
    </>
  );
}
