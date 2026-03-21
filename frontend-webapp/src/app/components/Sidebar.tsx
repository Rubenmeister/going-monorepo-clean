'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';
import Image from 'next/image';

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
    window.location.href = '/auth/login';
    setIsOpen(false);
  };

  const isActive = (href: string) => pathname === href;

  return (
    <>
      {/* Hamburger Button - Mobile */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 md:hidden bg-[#ff4c41] text-white p-2 rounded-lg hover:bg-[#e63a2f] transition-all shadow-lg"
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

      {/* Overlay */}
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
          className="absolute top-4 right-4 z-50 md:hidden text-gray-400 hover:text-gray-600"
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Logo Section */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-center">
          <Image
            src="/going-logo.png"
            alt="Going"
            width={140}
            height={80}
            className="h-16 w-auto object-contain cursor-pointer"
            onClick={() => handleNavigation('/')}
            priority
          />
        </div>

        {/* User Info Card */}
        {auth.user ? (
          <div className="px-4 py-3 border-b border-gray-100 bg-red-50">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 bg-[#ff4c41] rounded-full flex items-center justify-center text-white font-bold text-base shadow-sm flex-shrink-0">
                {auth.user.firstName?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate text-sm">
                  {auth.user.firstName}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {auth.user.email}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.href}
              onClick={() => handleNavigation(item.href)}
              className={`
                w-full text-left px-4 py-3 rounded-xl transition-all duration-200
                flex items-center space-x-3 font-medium
                ${
                  isActive(item.href)
                    ? 'bg-[#ff4c41] text-white shadow-sm'
                    : 'text-gray-700 hover:bg-red-50 hover:text-[#ff4c41]'
                }
              `}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-gray-100 p-4 bg-gray-50">
          {auth.user ? (
            <>
              <p className="text-xs text-gray-500 mb-3 px-2 font-medium uppercase tracking-wide">
                Cuenta
              </p>
              <button
                onClick={handleLogout}
                className="w-full px-4 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors font-semibold text-sm flex items-center justify-center space-x-2"
              >
                <span>🚪</span>
                <span>Cerrar Sesión</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => handleNavigation('/auth/login')}
              className="w-full px-4 py-3 bg-[#ff4c41] text-white rounded-xl hover:bg-[#e63a2f] transition-colors font-semibold text-sm shadow-sm"
            >
              Iniciar Sesión
            </button>
          )}
          <p className="text-xs text-gray-400 text-center mt-4">
            © 2026 Going Ecuador
          </p>
        </div>
      </aside>
    </>
  );
}
