import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { corpFetch } from '../lib/api';

interface LayoutProps {
  children: React.ReactNode;
}

type NavItem = { href: string; label: string; icon: string; badge?: number };

const BASE_NAV: NavItem[] = [
  { href: '/dashboard',   label: 'Dashboard',      icon: '🏠' },
  { href: '/bookings',    label: 'Reservas',        icon: '📋' },
  { href: '/approvals',   label: 'Aprobaciones',    icon: '✅' },
  { href: '/tracking',    label: 'Seguimiento',      icon: '📍' },
  { href: '/reports',     label: 'Reportes',         icon: '📊' },
  { href: '/invoices',    label: 'Facturas',         icon: '🧾' },
  { href: '/settings',    label: 'Configuración',    icon: '⚙️' },
];

export default function Layout({ children }: LayoutProps) {
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const { pathname } = useRouter();

  // Badge dinámico de aprobaciones pendientes
  useEffect(() => {
    const token = (session as any)?.accessToken;
    if (!token) return;
    corpFetch<{ approvals?: unknown[] }>('/corporate/approvals/pending', token)
      .then((res) => setPendingCount(res.approvals?.length ?? 0))
      .catch(() => setPendingCount(null));
  }, [session]);

  const NAV_ITEMS = BASE_NAV.map((item) =>
    item.href === '/approvals' && pendingCount
      ? { ...item, badge: pendingCount }
      : item
  );

  const userName =
    session?.user?.name || session?.user?.email?.split('@')[0] || 'Usuario';
  const initial = userName.charAt(0).toUpperCase();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 fixed md:relative w-64 h-full z-50 flex flex-col transition-transform duration-200`}
        style={{ backgroundColor: '#011627' }}
      >
        {/* Logo */}
        <div
          className="px-5 py-4 flex items-center gap-3 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div>
            <div className="flex items-center gap-2">
              <span
                className="text-xl font-black tracking-tight"
                style={{ color: '#ff4c41' }}
              >
                Going
              </span>
              <span className="text-xs font-semibold text-white/50 uppercase tracking-widest">
                Empresas
              </span>
            </div>
            <p
              className="text-xs mt-0.5"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              Portal Corporativo
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 mt-3 px-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ href, label, icon, badge }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
                style={
                  active
                    ? { backgroundColor: '#ff4c41', color: '#fff' }
                    : { color: 'rgba(255,255,255,0.6)' }
                }
              >
                <span className="text-base">{icon}</span>
                <span className="flex-1">{label}</span>
                {badge && (
                  <span
                    className="text-white text-xs font-bold px-1.5 py-0.5 rounded-full"
                    style={{
                      backgroundColor: active
                        ? 'rgba(255,255,255,0.3)'
                        : '#ff4c41',
                    }}
                  >
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div
          className="p-3 flex-shrink-0"
          style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0"
              style={{ backgroundColor: '#ff4c41' }}
            >
              {initial}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {userName}
              </p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Going Empresas
              </p>
            </div>
          </div>
          <button
            onClick={() =>
              signOut({ redirect: true, callbackUrl: '/auth/login' })
            }
            className="w-full px-4 py-2 text-xs rounded-xl transition-colors text-left flex items-center gap-2"
            style={{
              backgroundColor: 'rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.5)',
            }}
          >
            🚪 Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-4 px-6 py-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden text-gray-500 hover:text-gray-700"
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
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: '#ff4c41' }}
              />
              <h2 className="text-base font-semibold text-gray-800">
                {NAV_ITEMS.find((n) => n.href === pathname)?.label ||
                  'Portal Corporativo'}
              </h2>
            </div>
            <div className="ml-auto">
              <span className="text-sm text-gray-400 hidden sm:block">
                {session?.user?.email}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-gray-50">{children}</main>
      </div>
    </div>
  );
}
