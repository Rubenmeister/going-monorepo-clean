'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';

const NAV_LINKS = [
  { label: 'INICIO',          href: '/' },
  { label: 'TRANSPORTE',      href: '/services/transport' },
  { label: 'CONDUCTORES',     href: '/conductores' },
  { label: 'COMUNIDAD GOING', href: '/comunidad' },
  { label: 'ACADEMIA GOING',  href: '/academy' },
  { label: 'QUIÉNES SOMOS',  href: '/quienes-somos' },
  { label: 'EMPRESAS',        href: '/empresas/auth/login' },
];

// Real brand SVG icon paths (Simple Icons standard, viewBox 0 0 24 24)
const SOCIAL_LINKS = [
  {
    name: 'Facebook',
    href: 'https://facebook.com/goingappecuador',
    color: '#1877F2',
    path: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
  },
  {
    name: 'Instagram',
    href: 'https://www.instagram.com/goingappecuador/',
    color: '#E4405F',
    path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z',
  },
  {
    name: 'WhatsApp',
    href: 'https://wa.me/593991234567',
    color: '#25D366',
    path: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z',
  },
  {
    name: 'LinkedIn',
    href: 'https://www.linkedin.com/company/going-app',
    color: '#0A66C2',
    path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
  },
  {
    name: 'X',
    href: 'https://twitter.com/GoingAppEcuador1',
    color: '#000000',
    path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
  },
  {
    name: 'Threads',
    href: 'https://www.threads.net/@goingappecuador',
    color: '#101010',
    path: 'M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.535-.02 4.351-.693 5.374-2 .911-1.168 1.362-2.688 1.34-4.521-.014-1.97-.451-3.51-1.34-4.454-.985-1.05-2.424-1.582-4.29-1.582h-.002c-1.25 0-2.36.412-3.194 1.163-.978.876-1.523 2.193-1.523 3.625 0 .34.033.667.097.976.238 1.17.838 2.032 1.584 2.032.363 0 .637-.162.777-.455.237-.482.317-1.213.195-1.96l-.003-.019c-.03-.176-.071-.35-.124-.512a1.648 1.648 0 01-.082-.518 1.77 1.77 0 011.794-1.747 1.77 1.77 0 011.798 1.747c0 1.54-1.13 2.646-2.753 2.646-1.064 0-1.924-.51-2.484-1.438-.473-.769-.726-1.775-.726-2.905 0-1.944.755-3.67 2.127-4.866 1.25-1.092 2.917-1.687 4.7-1.687h.003c2.427 0 4.375.76 5.64 2.196 1.185 1.35 1.811 3.319 1.826 5.692.022 2.377-.616 4.404-1.852 5.878-1.362 1.626-3.454 2.492-6.05 2.51z',
  },
  {
    name: 'YouTube',
    href: 'https://www.youtube.com/@Goingappecuador',
    color: '#FF0000',
    path: 'M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z',
  },
  {
    name: 'TikTok',
    href: 'https://www.tiktok.com/@goingappecuador',
    color: '#010101',
    path: 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z',
  },
  {
    name: 'Telegram',
    href: 'https://t.me/goingappecuador',
    color: '#26A5E4',
    path: 'M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z',
  },
];

function SocialIcon({
  path,
  name,
  href,
  color,
}: {
  path: string;
  name: string;
  href: string;
  color: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={name}
      className="transition-transform hover:scale-125"
      style={{ color }}
    >
      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
        <path d={path} />
      </svg>
    </a>
  );
}

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const { auth } = useMonorepoApp();
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await auth.logout?.();
    window.location.href = '/auth/login';
  };

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm">
      {/* ── Row 1: Logo · Nav Links · User ───────────────────── */}
      <div className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16 gap-4">
          {/* Logo — red+black horizontal */}
          <Link href="/" className="flex-shrink-0">
            <Image
              src="/going-logo-h.png"
              alt="Going"
              width={130}
              height={44}
              className="h-10 w-auto object-contain"
              priority
            />
          </Link>

          {/* Desktop Nav Links — black bold uppercase */}
          <nav className="hidden lg:flex items-center gap-7 flex-1 justify-end mr-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={`text-xs font-bold tracking-widest transition-colors whitespace-nowrap ${
                  isActive(link.href)
                    ? 'text-[#ff4c41] border-b-2 border-[#ff4c41] pb-0.5'
                    : 'text-gray-900 hover:text-[#ff4c41]'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right: User Avatar / Login + Mobile Hamburger */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Desktop: User dropdown or login button */}
            {auth.user ? (
              <div className="relative hidden md:block" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm"
                    style={{ backgroundColor: '#ff4c41' }}
                  >
                    {auth.user.firstName?.[0]?.toUpperCase() ?? 'U'}
                  </div>
                  <svg
                    className={`w-4 h-4 text-gray-500 transition-transform ${
                      userMenuOpen ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">
                        {auth.user.firstName}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {auth.user.email}
                      </p>
                    </div>
                    <Link
                      href="/account"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <span>👤</span> Mi Cuenta
                    </Link>
                    <Link
                      href="/bookings"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <span>🎫</span> Mis Reservas
                    </Link>
                    <Link
                      href="/academy"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <span>📚</span> Academia
                    </Link>
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                      >
                        <span>🚪</span> Cerrar Sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Ingresar
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-2 text-sm font-medium text-white rounded-xl transition-colors"
                  style={{ backgroundColor: '#ff4c41' }}
                >
                  Registrarse
                </Link>
              </div>
            )}

            {/* Mobile hamburger — inside navbar, never covers logo */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label="Abrir menú"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {mobileOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>


      {/* ── Mobile Menu ─────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white shadow-lg">
          <nav className="px-4 py-3 space-y-0.5">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block px-4 py-3 rounded-xl text-xs font-bold tracking-widest transition-colors ${
                  isActive(link.href)
                    ? 'bg-[#ff4c41] text-white'
                    : 'text-gray-900 hover:bg-gray-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Account links on mobile */}
          {auth.user ? (
            <div className="px-4 pb-3 border-t border-gray-100 mt-1 pt-3 space-y-0.5">
              <Link
                href="/account"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-50"
              >
                <span>👤</span> Mi Cuenta
              </Link>
              <Link
                href="/bookings"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-50"
              >
                <span>🎫</span> Mis Reservas
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-red-600 hover:bg-red-50"
              >
                <span>🚪</span> Cerrar Sesión
              </button>
            </div>
          ) : (
            <div className="px-4 pb-4 border-t border-gray-100 mt-1 pt-3 flex gap-2">
              <Link
                href="/auth/login"
                onClick={() => setMobileOpen(false)}
                className="flex-1 text-center px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 border border-gray-200 hover:bg-gray-50"
              >
                Ingresar
              </Link>
              <Link
                href="/auth/register"
                onClick={() => setMobileOpen(false)}
                className="flex-1 text-center px-4 py-2.5 rounded-xl text-sm font-medium text-white"
                style={{ backgroundColor: '#ff4c41' }}
              >
                Registrarse
              </Link>
            </div>
          )}

        </div>
      )}
    </header>
  );
}
