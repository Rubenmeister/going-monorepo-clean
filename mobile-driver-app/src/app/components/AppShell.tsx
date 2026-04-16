import { useState } from 'react';
import { usePathname, useRouter } from 'expo-router';
import { useDriver } from '../store';

// Tabs del menú lateral (secundarios)
const NAV = [
  { href: '/dashboard', icon: '🏠', label: 'DASHBOARD' },
  { href: '/trip', icon: '🚗', label: 'MIS VIAJES' },
  { href: '/earnings', icon: '💰', label: 'GANANCIAS' },
  { href: '/profile', icon: '👤', label: 'PERFIL' },
  { href: '/documents', icon: '📄', label: 'DOCUMENTOS' },
  { href: '/ratings', icon: '⭐', label: 'CALIFICACIONES' },
  { href: '/support', icon: '❓', label: 'SOPORTE' },
];

// Tabs visibles en la barra inferior
const BOTTOM_TABS = [
  { href: '/dashboard', icon: '🏠', label: 'Inicio' },
  { href: '/trip', icon: '🚗', label: 'Viaje' },
  { href: '/earnings', icon: '💰', label: 'Ganancias' },
  { href: '/profile', icon: '👤', label: 'Perfil' },
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
    ? `${driver.firstName?.[0] ?? ''}${driver.lastName?.[0] ?? ''}`.toUpperCase()
    : 'D';

  const go = (href: string) => {
    router.push(href);
    setOpen(false);
  };

  const handleLogout = () => {
    setOpen(false);
    logout();
    router.replace('/login');
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      {/* ── Overlay ── */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className="fixed top-0 left-0 h-full z-50 flex flex-col transition-transform duration-300 ease-in-out"
        style={{
          width: 280,
          backgroundColor: '#011627',
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
        }}
      >
        {/* Brand */}
        <div className="px-6 pt-8 pb-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-2 mb-5">
            <span
              style={{ color: '#ff4c41', fontWeight: 900, fontSize: 24, letterSpacing: -1 }}
            >
              Going
            </span>
            <span className="text-xs text-white/40 font-bold tracking-widest">
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
                    style={{ backgroundColor: isOnline ? '#22c55e' : '#6b7280' }}
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
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <button
                key={item.href}
                onClick={() => go(item.href)}
                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl mb-0.5 transition-all text-left"
                style={
                  active
                    ? { backgroundColor: '#ff4c41', color: '#fff' }
                    : { color: 'rgba(255,255,255,0.6)' }
                }
              >
                <span className="text-lg leading-none w-6 text-center">{item.icon}</span>
                <span className="text-xs font-bold tracking-wider">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-5 py-3 rounded-xl text-xs font-bold tracking-wider transition-colors"
            style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#f87171' }}
          >
            <span className="text-base">🚪</span>
            CERRAR SESIÓN
          </button>
          <p className="text-center text-xs mt-4" style={{ color: 'rgba(255,255,255,0.12)' }}>
            © 2026 Going Ecuador · Conductor
          </p>
        </div>
      </aside>

      {/* ── Sticky header ── */}
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
          <span className="block h-0.5 bg-white rounded" style={{ width: 18 }} />
          <span className="block h-0.5 bg-white rounded" style={{ width: 14 }} />
          <span className="block h-0.5 bg-white rounded" style={{ width: 18 }} />
        </button>

        <span style={{ color: '#ff4c41', fontWeight: 900, fontSize: 20, letterSpacing: -0.5 }}>
          Going
        </span>
        {title && (
          <span className="text-sm text-white/50 ml-2">· {title}</span>
        )}

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

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto pb-16">{children}</main>

      {/* ── Bottom tab bar ── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-20 flex"
        style={{
          backgroundColor: '#fff',
          borderTop: '1px solid #f0f0f0',
          boxShadow: '0 -2px 12px rgba(0,0,0,0.06)',
          height: 60,
        }}
      >
        {BOTTOM_TABS.map((tab) => {
          const active = pathname.startsWith(tab.href);
          return (
            <button
              key={tab.href}
              onClick={() => go(tab.href)}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-all relative"
              style={{ color: active ? '#ff4c41' : '#9ca3af' }}
            >
              <span style={{ fontSize: 18 }}>{tab.icon}</span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: active ? 700 : 500,
                  letterSpacing: 0.3,
                }}
              >
                {tab.label}
              </span>
              {active && (
                <span
                  className="absolute bottom-0 w-6 h-0.5 rounded-full"
                  style={{ backgroundColor: '#ff4c41' }}
                />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
