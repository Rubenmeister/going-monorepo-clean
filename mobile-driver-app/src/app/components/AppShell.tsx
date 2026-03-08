'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useDriver } from '../store';

const TABS = [
  { href: '/dashboard', icon: '🏠', label: 'Dashboard' },
  { href: '/trip', icon: '🚗', label: 'Viajes' },
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
  const { isOnline } = useDriver();

  return (
    <div className="min-h-screen bg-slate-200 flex justify-center">
      <div className="relative w-full max-w-[430px] min-h-screen flex flex-col bg-[#f8fafc] shadow-2xl">
        {/* Top bar */}
        <header
          className="flex items-center gap-2 px-4 py-3 text-white flex-shrink-0"
          style={{ backgroundColor: '#011627' }}
        >
          <span className="font-black text-lg" style={{ color: '#ff4c41' }}>
            Going
          </span>
          <span className="text-xs text-white/40 font-medium">Conductor</span>
          {title && (
            <span className="text-sm font-medium text-white/50 ml-1">
              · {title}
            </span>
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

        {/* Page content */}
        <main className="flex-1 overflow-y-auto pb-16">{children}</main>

        {/* Bottom nav */}
        <nav
          className="fixed bottom-0 z-50 bg-white border-t border-gray-100"
          style={{
            width: 'min(100vw, 430px)',
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          <div className="flex">
            {TABS.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className="flex-1 flex flex-col items-center py-2 gap-0.5 text-xs font-medium transition-colors"
                style={{
                  color: pathname.startsWith(t.href) ? '#ff4c41' : '#9ca3af',
                }}
              >
                <span className="text-xl leading-none">{t.icon}</span>
                <span>{t.label}</span>
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
