'use client';

import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useTranslation } from '@/hooks/useTranslation';

/**
 * Navigation bar component
 * Sticky header with logo, navigation links, language switcher, and user menu
 */
export function Navbar() {
  const router = useRouter();
  const { auth } = useMonorepoApp();
  const { t } = useTranslation();

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        {/* Left - Logo */}
        <Logo onLogoClick={() => router.push('/')} />

        {/* Center - Navigation Links (Desktop) */}
        <NavLinks t={t} />

        {/* Right - Actions */}
        <RightActions
          auth={auth}
          t={t}
          onLoginClick={() => router.push('/auth/login')}
        />
      </div>
    </nav>
  );
}

/**
 * Logo component — imagen principal con fallback de texto Going
 */
function Logo({ onLogoClick }: { onLogoClick: () => void }) {
  return (
    <div
      className="flex items-center cursor-pointer gap-1"
      onClick={onLogoClick}
    >
      <Image
        src="/going-logo-h.png"
        alt="Going Ecuador"
        width={120}
        height={40}
        priority
        className="object-contain"
        onError={(e) => {
          // Fallback: ocultar imagen y mostrar texto
          (e.target as HTMLImageElement).style.display = 'none';
          const parent = (e.target as HTMLImageElement).parentElement;
          if (parent && !parent.querySelector('.logo-text-fallback')) {
            const span = document.createElement('span');
            span.className = 'logo-text-fallback';
            span.style.cssText = 'color:#ff4c41;font-weight:900;font-size:22px;letter-spacing:-1px';
            span.textContent = 'Going';
            parent.appendChild(span);
          }
        }}
      />
    </div>
  );
}

/**
 * Provider dropdown items
 */
const PROVIDER_ITEMS = [
  { icon: '🚗', label: 'Conductores',        desc: 'Gana manejando',          href: '/conductores',        registro: '/conductores/registro',        color: '#16a34a' },
  { icon: '🏡', label: 'Anfitriones',        desc: 'Publica tu espacio',      href: '/anfitriones',        registro: '/anfitriones/registro',        color: '#7c3aed' },
  { icon: '🏺', label: 'Promotores Locales', desc: 'Ofrece tours únicos',     href: '/promotores-locales', registro: '/promotores-locales/registro', color: '#0891b2' },
  { icon: '🧗', label: 'Operadores',         desc: 'Aventuras y actividades', href: '/operadores',         registro: '/operadores/registro',         color: '#d97706' },
];

const DISCOVER_ITEMS = [
  { icon: '🗺️', label: 'Tours',         desc: 'Galápagos, Sierra, Costa…', href: '/tours',         color: '#10b981' },
  { icon: '🎭', label: 'Experiencias',  desc: 'Aventura, cultura, gastronomía', href: '/experiences',   color: '#7c3aed' },
  { icon: '🏨', label: 'Hospedaje',     desc: 'Hoteles, cabañas, glamping', href: '/accommodation', color: '#059669' },
  { icon: '📦', label: 'Envíos',        desc: 'Express el mismo día',      href: '/envios',         color: '#f59e0b' },
];

/**
 * Navigation links component
 */
function NavLinks({ t }: { t: (key: string) => string }) {
  const [providerOpen,  setProviderOpen]  = useState(false);
  const [discoverOpen,  setDiscoverOpen]  = useState(false);
  const providerRef = useRef<HTMLDivElement>(null);
  const discoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (providerRef.current && !providerRef.current.contains(e.target as Node)) setProviderOpen(false);
      if (discoverRef.current && !discoverRef.current.contains(e.target as Node)) setDiscoverOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="hidden lg:flex gap-7 items-center">
      <Link href="/" className="text-gray-700 hover:text-[#ff4c41] transition-colors font-medium text-sm">
        Inicio
      </Link>

      {/* Descubrir dropdown */}
      <div className="relative" ref={discoverRef}>
        <button
          onClick={() => { setDiscoverOpen(v => !v); setProviderOpen(false); }}
          className="flex items-center gap-1 text-gray-700 hover:text-[#ff4c41] transition-colors font-medium text-sm"
        >
          Descubrir
          <svg className={`w-3.5 h-3.5 transition-transform ${discoverOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {discoverOpen && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
            {DISCOVER_ITEMS.map(item => (
              <Link key={item.href} href={item.href} onClick={() => setDiscoverOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors">
                <span className="text-xl w-8 text-center flex-shrink-0">{item.icon}</span>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{item.label}</p>
                  <p className="text-xs text-gray-400">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Link href="/quienes-somos" className="text-gray-700 hover:text-[#ff4c41] transition-colors font-medium text-sm">
        Quiénes somos
      </Link>
      <Link href="/academy" className="flex items-center gap-1 text-gray-700 hover:text-[#ff4c41] transition-colors font-medium text-sm">
        📚 Academia
        <span className="text-xs font-bold px-1.5 py-0.5 rounded-full text-white ml-0.5" style={{ backgroundColor: '#ff4c41', fontSize: '9px' }}>
          Gratis
        </span>
      </Link>

      {/* Únete dropdown */}
      <div className="relative" ref={providerRef}>
        <button
          onClick={() => { setProviderOpen(v => !v); setDiscoverOpen(false); }}
          className="flex items-center gap-1 text-gray-700 hover:text-[#ff4c41] transition-colors font-medium text-sm"
        >
          Únete
          <svg className={`w-3.5 h-3.5 transition-transform ${providerOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {providerOpen && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider px-4 pt-2 pb-1">
              Proveedores Going
            </p>
            {PROVIDER_ITEMS.map(item => (
              <div key={item.href} className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors group">
                <Link href={item.href} onClick={() => setProviderOpen(false)}
                  className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-xl w-8 text-center flex-shrink-0">{item.icon}</span>
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 text-sm">{item.label}</div>
                    <div className="text-xs text-gray-400">{item.desc}</div>
                  </div>
                </Link>
                <Link href={item.registro} onClick={() => setProviderOpen(false)}
                  className="ml-2 flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-lg text-white transition-opacity hover:opacity-80"
                  style={{ backgroundColor: item.color }}>
                  Registrarme
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Right actions: búsqueda + CTA + user menu
 */
function RightActions({ auth, t, onLoginClick }: { auth: any; t: (k: string) => string; onLoginClick: () => void }) {
  return (
    <div className="flex items-center gap-3">
      <LanguageSwitcher />

      {/* Búsqueda */}
      <Link href="/search"
        className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 hover:text-[#ff4c41] transition-colors"
        title="Buscar">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z" />
        </svg>
      </Link>

      {/* CTA principal */}
      <Link href="/ride"
        className="px-4 py-2 rounded-xl text-white font-semibold text-sm transition-colors hover:opacity-90"
        style={{ backgroundColor: '#ff4c41' }}>
        Reservar viaje
      </Link>

      {/* User dropdown o login */}
      {auth.user ? <UserMenu user={auth.user} auth={auth} /> : (
        <Link href="/auth/login"
          className="hidden md:block px-4 py-2 rounded-xl text-sm font-medium text-gray-700 border border-gray-200 hover:bg-gray-50 transition-colors">
          Ingresar
        </Link>
      )}
    </div>
  );
}

/**
 * User dropdown menu
 */
function UserMenu({ user, auth }: { user: any; auth: any }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    await auth.logout?.();
    window.location.href = '/auth/login';
  };

  return (
    <div className="relative hidden md:block" ref={ref}>
      <button onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 p-1 rounded-xl hover:bg-gray-50 transition-colors">
        <div className="w-9 h-9 rounded-full bg-[#ff4c41] flex items-center justify-center text-white font-bold text-sm">
          {user.firstName?.[0]?.toUpperCase() ?? 'U'}
        </div>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-50">
          {/* User info */}
          <div className="px-4 py-2.5 border-b border-gray-100">
            <p className="text-sm font-bold text-gray-900">{user.firstName}</p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>

          {/* Links */}
          {[
            { icon: '🏠', label: 'Dashboard',       href: '/dashboard/pasajero' },
            { icon: '🎫', label: 'Mis Reservas',    href: '/bookings'            },
            { icon: '👤', label: 'Mi Cuenta',       href: '/account'             },
            { icon: '⭐', label: 'Puntos Going',    href: '/puntos'              },
            { icon: '💳', label: 'Wallet',          href: '/payment/wallet'      },
            { icon: '🎓', label: 'Academia',        href: '/academy'             },
          ].map(item => (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              <span>{item.icon}</span> {item.label}
            </Link>
          ))}

          <div className="border-t border-gray-100 mt-1 pt-1">
            <button onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
              <span>🚪</span> Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
