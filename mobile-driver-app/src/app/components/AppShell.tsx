'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useDriver } from '../store';

const NAV = [
  { href: '/dashboard', icon: '🏠', label: 'DASHBOARD' },
  { href: '/trip', icon: '🚗', label: 'MIS VIAJES' },
  { href: '/earnings', icon: '💰', label: 'GANANCIAS' },
  { href: '/profile', icon: '👤', label: 'PERFIL' },
  { href: '/documents', icon: '📄', label: 'DOCUMENTOS' },
  { href: '/ratings', icon: '⭐', label: 'CALIFICACIONES' },
  { href: '/support', icon: '❓', label: 'SOPORTE' },
];

export default function AppShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { driver, isOnline, logout } = useDriver();
  const [open, setOpen] = useState(false);

  const initials = driver
    ? `${driver.firstName?.[0] ?? ''}${
        driver.lastName?.[0] ?? ''
      }`.toUpperCase()
    : 'D';

  const handleLogout = () => {
    setOpen(false);
    logout();
    router.replace('/login');
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className="fixed top-0 left-0 h-full z-50 flex flex-col transition-transform duration-300 ease-in-out"
        style={{
          width: 280,
          backgroundColor: '#011627',
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
        }}
      >
        {/* Brand */}
        <div className="px-6 pt-8 pb-6 border-b border-white/10">
          <div className="flex items-center gap-2 mb-5">
            <span className="font-black text-2xl" style={{ color: '#ff4c41' }}>
              Going
            </span>
            <span className="text-xs text-white/40 font-medium tracking-wider">
              CONDUCTOR
            </span>
          </div>
          {/* Driver card */}
          {driver && (
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center text-base font-black text-white flex-shrink-0"
                style={{ backgroundColor: '#ff4c41' }}
              >
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">
                  {driver.firstName} {driver.lastName}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      backgroundColor: isOnline ? '#22c55e' : '#6b7280',
                    }}
                  />
                  <span
                    className="text-xs"
                    style={{ color: isOnline ? '#4ade80' : '#6b7280' }}
                  >
                    {isOnline ? 'En línea' : 'Fuera de línea'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-4">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-4 px-6 py-3.5 mx-3 rounded-xl mb-0.5 transition-all"
                style={
                  active
                    ? { backgroundColor: '#ff4c41', color: '#fff' }
                    : { color: 'rgba(255,255,255,0.6)' }
                }
              >
                <span className="text-lg leading-none w-6 text-center">
                  {item.icon}
                </span>
                <span className="text-xs font-bold tracking-wider">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-5 py-3 rounded-xl text-xs font-bold tracking-wider transition-colors"
            style={{
              backgroundColor: 'rgba(239,68,68,0.15)',
              color: '#f87171',
            }}
          >
            <span className="text-base">🚪</span>
            CERRAR SESIÓN
          </button>
        </div>
      </aside>

      {/* Sticky header */}
      <header
        className="sticky top-0 z-30 flex items-center px-4 py-3 text-white"
        style={{ backgroundColor: '#011627' }}
      >
        <button
          onClick={() => setOpen(true)}
          className="w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-lg mr-3 flex-shrink-0"
          style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
          aria-label="Abrir menú"
        >
          <span
            className="block w-4.5 h-0.5 bg-white rounded"
            style={{ width: 18 }}
          />
          <span
            className="block w-4.5 h-0.5 bg-white rounded"
            style={{ width: 14 }}
          />
          <span
            className="block w-4.5 h-0.5 bg-white rounded"
            style={{ width: 18 }}
          />
        </button>

        <span className="font-black text-base" style={{ color: '#ff4c41' }}>
          Going
        </span>
        {title && <span className="text-sm text-white/50 ml-2">· {title}</span>}

        <div className="ml-auto flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: isOnline ? '#22c55e' : '#6b7280' }}
          />
          <span className="text-xs text-white/50">
            {isOnline ? 'En línea' : 'Fuera de línea'}
          </span>
        </div>
      </header>

      {/* Main content */}
      <main>{children}</main>
    </div>
  );
}
