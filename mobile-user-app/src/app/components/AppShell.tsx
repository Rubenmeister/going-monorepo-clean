'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../store';

const TABS = [
  { href: '/home',     icon: '🏠', label: 'Inicio'    },
  { href: '/search',   icon: '🚗', label: 'Viaje'     },
  { href: '/wallet',   icon: '💳', label: 'Wallet'    },
  { href: '/bookings', icon: '🕐', label: 'Historial' },
  { href: '/sos',      icon: '🆘', label: 'SOS'       },
];

export default function AppShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const initials = user
    ? `${user.firstName[0]}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : '?';

  return (
    <div className="min-h-screen bg-slate-200 flex justify-center">
      <div className="relative w-full max-w-[430px] min-h-screen flex flex-col bg-[#f8fafc] shadow-2xl">

        {/* ── Top bar ── */}
        <header
          className="flex items-center justify-between px-4 py-3 flex-shrink-0"
          style={{ backgroundColor: '#011627' }}
        >
          {/* Logo */}
          <div className="flex items-center gap-2">
            <span className="font-black text-xl tracking-tight" style={{ color: '#ff4c41' }}>
              Going
            </span>
            {title && (
              <span className="text-sm font-medium text-white/50 ml-1">· {title}</span>
            )}
          </div>

          {/* Avatar + dropdown */}
          {user && (
            <div className="flex items-center gap-3">
              <Link href="/profile"
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #0033A0, #ff4c41)' }}
              >
                {initials}
              </Link>
              <button
                onClick={logout}
                className="text-white/40 hover:text-white/70 text-xs transition-colors"
              >
                ✕
              </button>
            </div>
          )}
        </header>

        {/* ── Page content ── */}
        <main className="flex-1 overflow-y-auto pb-16">{children}</main>

        {/* ── Bottom nav ── */}
        <nav
          className="fixed bottom-0 z-50 bg-white border-t border-gray-100"
          style={{
            width: 'min(100vw, 430px)',
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          <div className="flex">
            {TABS.map((t) => {
              const isActive = pathname === t.href || pathname.startsWith(t.href + '?');
              const isSOS = t.href === '/sos';
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  className="flex-1 flex flex-col items-center py-2 gap-0.5 text-xs font-medium transition-colors"
                  style={{
                    color: isSOS ? '#ef4444' : isActive ? '#ff4c41' : '#9ca3af',
                  }}
                >
                  <span className="text-xl leading-none">{t.icon}</span>
                  <span>{t.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

      </div>
    </div>
  );
}
