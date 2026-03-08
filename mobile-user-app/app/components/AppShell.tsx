'use client';
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '../store';

const NAV = [
  { href: '/home', icon: '🏠', label: 'INICIO' },
  { href: '/profile', icon: '👤', label: 'PERFIL' },
  { href: '/bookings', icon: '📋', label: 'HISTORIAL' },
  { href: '/reviews', icon: '⭐', label: 'MIS RESEÑAS' },
  { href: '/security', icon: '🔒', label: 'SEGURIDAD' },
  { href: '/sos', icon: '🚨', label: 'SOS', danger: true },
  { href: '/tracking', icon: '📍', label: 'COMPARTIR TRACKING' },
];

export default function AppShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const go = (href: string) => {
    router.push(href);
    setOpen(false);
  };
  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : '?';

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* ── Top header ── */}
      <header
        className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 shadow-md"
        style={{ backgroundColor: '#011627' }}
      >
        <button
          onClick={() => setOpen(true)}
          className="flex flex-col gap-[5px] p-1.5 rounded-lg hover:bg-white/10 transition"
          aria-label="Abrir menú"
        >
          <span className="block w-5 h-0.5 bg-white rounded" />
          <span className="block w-5 h-0.5 bg-white rounded" />
          <span className="block w-5 h-0.5 bg-white rounded" />
        </button>

        <div className="flex-1">
          <Image
            src="/going-logo-white-h.png"
            alt="Going"
            height={26}
            width={90}
            style={{ objectFit: 'contain' }}
          />
        </div>

        {title && (
          <span className="text-sm font-medium text-white/50 hidden sm:block">
            {title}
          </span>
        )}

        <button
          onClick={() => go('/profile')}
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black text-white flex-shrink-0 shadow-sm"
          style={{ backgroundColor: '#ff4c41' }}
        >
          {initials}
        </button>
      </header>

      {/* ── Main content ── */}
      <main>{children}</main>

      {/* ── Overlay ── */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-30 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Sidebar drawer ── */}
      <aside
        className="fixed left-0 top-0 bottom-0 z-40 flex flex-col transition-transform duration-300 ease-in-out"
        style={{
          width: 280,
          backgroundColor: '#011627',
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          boxShadow: open ? '4px 0 24px rgba(0,0,0,0.4)' : 'none',
        }}
      >
        {/* Sidebar top */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
        >
          <Image
            src="/going-logo-white-h.png"
            alt="Going"
            height={30}
            width={104}
            style={{ objectFit: 'contain' }}
          />
          <button
            onClick={() => setOpen(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition text-lg"
          >
            ✕
          </button>
        </div>

        {/* User card */}
        {user && (
          <div
            className="mx-3 my-3 rounded-xl p-3 flex items-center gap-3"
            style={{ backgroundColor: 'rgba(255,76,65,0.12)' }}
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-white text-base flex-shrink-0"
              style={{ backgroundColor: '#ff4c41' }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-white text-sm truncate">
                {user.firstName} {user.lastName}
              </p>
              <p
                className="text-xs truncate"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                {user.email}
              </p>
            </div>
          </div>
        )}

        {/* Nav items */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            const isDanger = (item as any).danger;
            return (
              <button
                key={item.href}
                onClick={() => go(item.href)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-150"
                style={{
                  backgroundColor: active
                    ? '#ff4c41'
                    : isDanger
                    ? 'rgba(239,68,68,0.08)'
                    : 'transparent',
                  color: active
                    ? '#fff'
                    : isDanger
                    ? '#f87171'
                    : 'rgba(255,255,255,0.65)',
                }}
              >
                <span className="text-base w-5 text-center">{item.icon}</span>
                <span className="text-xs font-bold tracking-widest">
                  {item.label}
                </span>
                {active && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/70" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div
          className="px-3 pb-6 pt-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
        >
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
            style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#f87171' }}
          >
            <span className="text-base w-5 text-center">🚪</span>
            <span className="text-xs font-bold tracking-widest">
              CERRAR SESIÓN
            </span>
          </button>
          <p
            className="text-center text-xs mt-4"
            style={{ color: 'rgba(255,255,255,0.12)' }}
          >
            © 2026 Going Ecuador
          </p>
        </div>
      </aside>
    </div>
  );
}
