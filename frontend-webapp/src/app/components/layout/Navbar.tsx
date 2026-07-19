'use client';

import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect, ComponentType } from 'react';
import Link from 'next/link';
// Logo: <img> directo. El optimizador de next/image devuelve 400 con los PNG del
// logo (caía al fallback de texto rojo). El asset estático se sirve sin problema.
import { useMonorepoApp } from '@/lib/providers';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useTranslation } from '@/hooks/useTranslation';
import { COLORS } from '../design-tokens';
import {
  IconPackage, IconMap, IconExperience, IconHotel,
  IconCar, IconCompass, IconUsers, IconGraduation,
  IconHome, IconBookmark, IconUser, IconStar, IconCard,
  IconLogout, IconSearch as IconSearchSvg, IconChevronDown,
  IconBook, IconChat, IconBell,
} from '../icons';

type IconComponent = ComponentType<{ size?: number; className?: string }>;

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
 * Logo component — imagen principal con fallback de texto Going App
 */
function Logo({ onLogoClick }: { onLogoClick: () => void }) {
  return (
    <div
      className="flex items-center cursor-pointer gap-1"
      onClick={onLogoClick}
    >
      {/* next/image (optimizador) devuelve 400 con este PNG y cae al fallback de
          texto rojo. <img> directo sirve el asset estático y es confiable. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/going-logo-h-tight.png"
        alt="Going App Ecuador"
        className="h-10 md:h-11 w-auto object-contain"
        onError={(e) => {
          // Fallback: ocultar imagen y mostrar texto
          (e.target as HTMLImageElement).style.display = 'none';
          const parent = (e.target as HTMLImageElement).parentElement;
          if (parent && !parent.querySelector('.logo-text-fallback')) {
            const span = document.createElement('span');
            span.className = 'logo-text-fallback';
            span.style.cssText = `color:${COLORS.brand.red};font-weight:900;font-size:22px;letter-spacing:-1px`;
            span.textContent = 'Going App';
            parent.appendChild(span);
          }
        }}
      />
    </div>
  );
}

/**
 * Provider dropdown items — opciones de "Únete como proveedor"
 */
interface ProviderItem {
  Icon: IconComponent;
  label: string;
  desc: string;
  href: string;
  registro: string;
  color: string;
}

const PROVIDER_ITEMS: ProviderItem[] = [
  { Icon: IconCar,     label: 'Conductores',        desc: 'Gana manejando',          href: '/conductores',        registro: '/conductores/registro',        color: COLORS.brand.red },
  { Icon: IconHotel,   label: 'Anfitriones',        desc: 'Publica tu espacio',      href: '/anfitriones',        registro: '/anfitriones/registro',        color: COLORS.system.blue },
  { Icon: IconCompass, label: 'Promotores Locales', desc: 'Ofrece tours únicos',     href: '/promotores-locales', registro: '/promotores-locales/registro', color: COLORS.state.success },
  { Icon: IconUsers,   label: 'Operadores',         desc: 'Aventuras y actividades', href: '/operadores',         registro: '/operadores/registro',         color: COLORS.brand.yellowDark },
];

/**
 * Discover dropdown items — categorías del producto Going App.
 *
 * ORDEN DE NEGOCIO (decidido por user):
 *   1. Envíos    → producto activo, prioritario en el catálogo
 *   2. Tours          → próximamente
 *   3. Experiencias   → próximamente
 *   4. Alojamiento    → próximamente
 *
 * Los 3 marcados como `comingSoon: true` se siguen mostrando en el
 * menú pero con badge "Próximamente" y opacity reducida; el click sí
 * lleva a la página (que tiene contenido demo/fallback), para que el
 * user pueda explorar lo que viene sin sentir que la app está rota.
 */
interface DiscoverItem {
  Icon: IconComponent;
  label: string;
  desc: string;
  href: string;
  color: string;
  comingSoon?: boolean;
}

const DISCOVER_ITEMS: DiscoverItem[] = [
  { Icon: IconPackage,    label: 'Envíos',       desc: 'Express el mismo día · Activo',         href: '/envios',         color: COLORS.brand.red },
  { Icon: IconMap,        label: 'Tours',        desc: 'Galápagos, Sierra, Costa…',             href: '/tours',          color: COLORS.gray[400], comingSoon: true },
  { Icon: IconExperience, label: 'Experiencias', desc: 'Aventura, cultura, gastronomía',        href: '/experiences',    color: COLORS.gray[400], comingSoon: true },
  { Icon: IconHotel,      label: 'Alojamiento',  desc: 'Hoteles, cabañas, glamping',            href: '/accommodation',  color: COLORS.gray[400], comingSoon: true },
];

// Comunicación: revista, blog y noticias — accesibles desde la primera página.
const COMMUNICATION_ITEMS: DiscoverItem[] = [
  { Icon: IconBook, label: 'Revista',  desc: 'Historias y viajes por Ecuador', href: '/revista', color: COLORS.brand.red, comingSoon: true },
  { Icon: IconChat, label: 'Blog',     desc: 'Consejos, rutas y novedades',    href: '/blog',    color: COLORS.brand.red },
  { Icon: IconBell, label: 'Noticias', desc: 'Lo último de Going App',         href: '/news',    color: COLORS.brand.red },
];

/**
 * Navigation links component
 */
function NavLinks({ t }: { t: (key: string) => string }) {
  const [providerOpen,  setProviderOpen]  = useState(false);
  const [discoverOpen,  setDiscoverOpen]  = useState(false);
  const [comunicacionOpen, setComunicacionOpen] = useState(false);
  const providerRef = useRef<HTMLDivElement>(null);
  const discoverRef = useRef<HTMLDivElement>(null);
  const comunicacionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (providerRef.current && !providerRef.current.contains(e.target as Node)) setProviderOpen(false);
      if (discoverRef.current && !discoverRef.current.contains(e.target as Node)) setDiscoverOpen(false);
      if (comunicacionRef.current && !comunicacionRef.current.contains(e.target as Node)) setComunicacionOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="hidden lg:flex gap-7 items-center">
      <Link href="/" className="text-gray-700 hover:text-[#FF4C41] transition-colors font-medium text-sm">
        Inicio
      </Link>

      {/* Descubrir dropdown */}
      <div className="relative" ref={discoverRef}>
        <button
          onClick={() => { setDiscoverOpen(v => !v); setProviderOpen(false); }}
          className="flex items-center gap-1 text-gray-700 hover:text-[#FF4C41] transition-colors font-medium text-sm"
        >
          Descubrir
          <IconChevronDown size={14} className={`transition-transform ${discoverOpen ? 'rotate-180' : ''}`} />
        </button>
        {discoverOpen && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
            {DISCOVER_ITEMS.map(item => (
              <Link key={item.href} href={item.href} onClick={() => setDiscoverOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${item.comingSoon ? 'hover:bg-gray-50' : 'hover:bg-red-50'}`}>
                <span
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: item.comingSoon ? COLORS.gray[100] : COLORS.brand.redBg,
                    color: item.color,
                  }}
                >
                  <item.Icon size={18} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`font-semibold text-sm ${item.comingSoon ? 'text-gray-500' : 'text-gray-900'}`}>{item.label}</p>
                    {item.comingSoon && (
                      <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full" style={{ backgroundColor: COLORS.brand.yellowBg, color: COLORS.brand.yellowDark }}>
                        Próximamente
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 truncate">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Link href="/quienes-somos" className="text-gray-700 hover:text-[#FF4C41] transition-colors font-medium text-sm">
        Quiénes somos
      </Link>
      <Link href="/academy" className="inline-flex items-center gap-1.5 text-gray-700 hover:text-[#FF4C41] transition-colors font-medium text-sm">
        <IconGraduation size={14} />
        Academia
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white ml-0.5" style={{ backgroundColor: COLORS.brand.red }}>
          Gratis
        </span>
      </Link>

      {/* Comunicación dropdown */}
      <div className="relative" ref={comunicacionRef}>
        <button
          onClick={() => { setComunicacionOpen(v => !v); setDiscoverOpen(false); setProviderOpen(false); }}
          className="flex items-center gap-1 text-gray-700 hover:text-[#FF4C41] transition-colors font-medium text-sm"
        >
          Comunicación
          <IconChevronDown size={14} className={`transition-transform ${comunicacionOpen ? 'rotate-180' : ''}`} />
        </button>
        {comunicacionOpen && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
            {COMMUNICATION_ITEMS.map(item => (
              <Link key={item.href} href={item.href} onClick={() => setComunicacionOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${item.comingSoon ? 'hover:bg-gray-50' : 'hover:bg-red-50'}`}>
                <span
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: item.comingSoon ? COLORS.gray[100] : COLORS.brand.redBg, color: item.color }}
                >
                  <item.Icon size={18} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`font-semibold text-sm ${item.comingSoon ? 'text-gray-500' : 'text-gray-900'}`}>{item.label}</p>
                    {item.comingSoon && (
                      <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full" style={{ backgroundColor: COLORS.brand.yellowBg, color: COLORS.brand.yellowDark }}>
                        Próximamente
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 truncate">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Únete dropdown */}
      <div className="relative" ref={providerRef}>
        <button
          onClick={() => { setProviderOpen(v => !v); setDiscoverOpen(false); }}
          className="flex items-center gap-1 text-gray-700 hover:text-[#FF4C41] transition-colors font-medium text-sm"
        >
          Únete
          <IconChevronDown size={14} className={`transition-transform ${providerOpen ? 'rotate-180' : ''}`} />
        </button>
        {providerOpen && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider px-4 pt-2 pb-1">
              Proveedores Going App
            </p>
            {PROVIDER_ITEMS.map(item => (
              <div key={item.href} className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors group">
                <Link href={item.href} onClick={() => setProviderOpen(false)}
                  className="flex items-center gap-3 flex-1 min-w-0">
                  <span
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${item.color}15`, color: item.color }}
                  >
                    <item.Icon size={18} />
                  </span>
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RightActions({ auth, t, onLoginClick }: { auth: any; t: (k: string) => string; onLoginClick: () => void }) {
  return (
    <div className="flex items-center gap-3">
      <LanguageSwitcher />

      {/* Búsqueda */}
      <Link href="/search"
        className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 hover:text-[#FF4C41] transition-colors"
        title="Buscar">
        <IconSearchSvg size={16} />
      </Link>

      {/* CTA "Reservar viaje" eliminado: el flujo de búsqueda vive
          exclusivamente en el form del home (#search-card) para evitar
          duplicación. El icono de buscar arriba sigue disponible. */}

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
interface UserMenuItem {
  Icon: IconComponent;
  label: string;
  href: string;
}

const USER_MENU_ITEMS: UserMenuItem[] = [
  { Icon: IconHome,       label: 'Dashboard',    href: '/dashboard/pasajero' },
  { Icon: IconBookmark,   label: 'Mis Reservas', href: '/bookings'           },
  { Icon: IconUser,       label: 'Mi Cuenta',    href: '/account'            },
  { Icon: IconStar,       label: 'Puntos Going App', href: '/puntos'             },
  { Icon: IconCard,       label: 'Wallet',       href: '/payment/wallet'     },
  { Icon: IconGraduation, label: 'Academia',     href: '/academy'            },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: COLORS.brand.red }}>
          {user.firstName?.[0]?.toUpperCase() ?? 'U'}
        </div>
        <IconChevronDown size={14} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-50">
          {/* User info */}
          <div className="px-4 py-2.5 border-b border-gray-100">
            <p className="text-sm font-bold text-gray-900">{user.firstName}</p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>

          {/* Links */}
          {USER_MENU_ITEMS.map(item => (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              <item.Icon size={16} className="text-gray-400" />
              {item.label}
            </Link>
          ))}

          <div className="border-t border-gray-100 mt-1 pt-1">
            <button onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
              <IconLogout size={16} />
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
