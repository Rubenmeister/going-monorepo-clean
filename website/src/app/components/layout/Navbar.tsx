'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { GoingLogo } from '../GoingLogo';

const NAV_ITEMS = [
  {
    label: 'Viajes',
    dropdown: [
      { href: 'https://app.goingec.com/transport?mode=shared', icon: '🚍', label: 'Compartido', sub: 'La forma más inteligente' },
      { href: 'https://app.goingec.com/transport?mode=private', icon: '🚗', label: 'Privado en SUV', sub: 'Exclusivo, flexible' },
      { href: 'https://app.goingec.com/envios', icon: '📦', label: 'Envíos', sub: 'Paquetes entre ciudades' },
      { href: 'https://app.goingec.com/corporate', icon: '🏢', label: 'Corporativo', sub: 'Soluciones para empresas' },
    ],
  },
  { label: 'Destinos', href: '/destinos' },
  { label: 'Promociones', href: '/promociones' },
  {
    label: 'Editorial',
    dropdown: [
      { href: '/noticiero', icon: '📰', label: 'Noticiero Going', sub: 'Actualidad del país' },
      { href: '/revista', icon: '📖', label: 'Revista', sub: 'Cultura y turismo' },
      { href: '/blog', icon: '✍️', label: 'Blog', sub: 'Tips y guías de viaje' },
    ],
  },
  { label: 'Comunidad', href: '/comunidad' },
  { label: 'Nosotros', href: '/quienes-somos' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDd, setOpenDd] = useState<string | null>(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/96 backdrop-blur-md shadow-sm border-b border-gray-100' : 'bg-white/90 backdrop-blur-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-[68px] flex items-center gap-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
          <GoingLogo size={28} />
          <span className="text-[22px] font-black text-[#011627] tracking-tight">Going</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
          {NAV_ITEMS.map((item) =>
            item.dropdown ? (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => setOpenDd(item.label)}
                onMouseLeave={() => setOpenDd(null)}
              >
                <button className="px-3.5 py-2 rounded-lg text-sm font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all flex items-center gap-1">
                  {item.label}
                  <span className="text-xs opacity-60">▾</span>
                </button>
                {openDd === item.label && (
                  <div className="absolute top-full left-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl p-2 min-w-[220px] z-50">
                    {item.dropdown.map((d) => (
                      <Link
                        key={d.href}
                        href={d.href}
                        className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-lg">{d.icon}</span>
                        <div>
                          <div className="text-sm font-bold text-gray-900">{d.label}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{d.sub}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={item.label}
                href={item.href!}
                className="px-3.5 py-2 rounded-lg text-sm font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all"
              >
                {item.label}
              </Link>
            )
          )}
        </nav>

        {/* CTAs */}
        <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
          <Link
            href="https://app.goingec.com/conductores"
            className="text-sm font-bold text-gray-600 hover:text-[#ff4c41] transition-colors px-3 py-2 rounded-lg hover:bg-red-50"
          >
            Soy conductor
          </Link>
          <Link
            href="https://app.goingec.com"
            className="px-5 py-2.5 rounded-xl text-sm font-black bg-[#ff4c41] text-white hover:bg-[#e03d32] transition-all hover:shadow-lg hover:shadow-red-200 hover:-translate-y-0.5"
          >
            Reservar viaje →
          </Link>
        </div>

        {/* Mobile burger */}
        <button
          className="lg:hidden ml-auto p-2 rounded-lg hover:bg-gray-50"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menú"
        >
          <div className="w-5 h-0.5 bg-gray-700 mb-1 transition-all" />
          <div className="w-5 h-0.5 bg-gray-700 mb-1" />
          <div className="w-5 h-0.5 bg-gray-700" />
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 px-6 py-4">
          {NAV_ITEMS.map((item) => (
            <div key={item.label}>
              {item.href ? (
                <Link
                  href={item.href}
                  className="block py-3 text-sm font-bold text-gray-700 border-b border-gray-50"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              ) : (
                <div className="py-3 border-b border-gray-50">
                  <div className="text-sm font-bold text-gray-400 mb-2">{item.label}</div>
                  {item.dropdown?.map((d) => (
                    <Link
                      key={d.href}
                      href={d.href}
                      className="flex items-center gap-2 py-1.5 pl-2 text-sm text-gray-600 font-semibold"
                      onClick={() => setMobileOpen(false)}
                    >
                      {d.icon} {d.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
          <Link
            href="https://app.goingec.com"
            className="block mt-4 text-center py-3 rounded-xl bg-[#ff4c41] text-white font-black text-sm"
            onClick={() => setMobileOpen(false)}
          >
            Reservar viaje →
          </Link>
        </div>
      )}
    </header>
  );
}
