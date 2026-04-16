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

/**
 * Navigation links component
 */
function NavLinks({ t }: { t: (key: string) => string }) {
  const [providerOpen, setProviderOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProviderOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="hidden lg:flex gap-8 items-center">
      <a href="/" className="text-gray-700 hover:text-[#ff4c41] transition-colors font-medium text-sm">
        {t('nav.inicio')}
      </a>
      <a href="/services" className="text-gray-700 hover:text-[#ff4c41] transition-colors font-medium text-sm">
        Servicios
      </a>
      <a href="/quienes-somos" className="text-gray-700 hover:text-[#ff4c41] transition-colors font-medium text-sm">
        Quiénes somos
      </a>
      <a href="/comunidad" className="text-gray-700 hover:text-[#ff4c41] transition-colors font-medium text-sm">
        Comunidad Going
      </a>
      <a href="/academy" className="flex items-center gap-1 text-gray-700 hover:text-[#ff4c41] transition-colors font-medium text-sm">
        📚 Academia
        <span className="text-xs font-bold px-1.5 py-0.5 rounded-full text-white ml-0.5" style={{ backgroundColor: '#ff4c41', fontSize: '9px' }}>
          Gratis
        </span>
      </a>

      {/* Únete dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setProviderOpen(v => !v)}
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
                <Link
                  href={item.href}
                  onClick={() => setProviderOpen(false)}
                  className="flex items-center gap-3 flex-1 min-w-0"
                >
                  <span className="text-xl w-8 text-center flex-shrink-0">{item.icon}</span>
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 text-sm">{item.label}</div>
                    <div className="text-xs text-gray-400">{item.desc}</div>
                  </div>
                </Link>
                <Link
                  href={item.registro}
                  onClick={() => setProviderOpen(false)}
                  className="ml-2 flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-lg text-white transition-opacity hover:opacity-80"
                  style={{ backgroundColor: item.color }}
                >
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
 * Right actions component (language switcher and user menu)
 */
function RightActions({
  auth,
  t,
  onLoginClick,
}: {
  auth: any;
  t: (key: string) => string;
  onLoginClick: () => void;
}) {
  const handleBuscarViaje = () => {
    window.location.href = '/ride';
  };

  return (
    <div className="flex items-center gap-4">
      {/* Language Switcher */}
      <LanguageSwitcher />

      {/* Buscar viaje — siempre visible */}
      <button
        onClick={handleBuscarViaje}
        className="px-4 py-2 bg-[#ff4c41] text-white rounded-lg hover:bg-[#e63a2f] transition-colors font-semibold text-sm"
      >
        Buscar viaje
      </button>

      {/* Avatar si está autenticado */}
      {auth.user && <UserMenu user={auth.user} />}
    </div>
  );
}

/**
 * User menu component
 */
function UserMenu({ user }: { user: any }) {
  return (
    <div className="hidden md:flex items-center gap-3">
      <div className="text-right">
        <p className="text-sm font-semibold text-gray-900">{user.firstName}</p>
        <p className="text-xs text-gray-500">{user.email}</p>
      </div>
      <div className="w-10 h-10 bg-[#ff4c41] rounded-full flex items-center justify-center text-white font-bold">
        {user.firstName?.[0]?.toUpperCase()}
      </div>
    </div>
  );
}

/**
 * Login button component
 */
function LoginButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 bg-[#ff4c41] text-white rounded-lg hover:bg-[#e63a2f] transition-colors font-semibold text-sm"
    >
      {label}
    </button>
  );
}
