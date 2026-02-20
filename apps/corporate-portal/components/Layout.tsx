import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/bookings', label: 'Bookings', icon: '📋' },
  { href: '/approvals', label: 'Approvals', icon: '✅' },
  { href: '/tracking', label: 'Live Tracking', icon: '📍' },
  { href: '/reports', label: 'Reports', icon: '📊' },
  { href: '/invoices', label: 'Invoices', icon: '🧾' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function Layout({ children }: LayoutProps) {
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useRouter();

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 fixed md:relative w-64 bg-gray-900 text-white h-full z-50 flex flex-col transition-transform duration-200`}
      >
        <div className="px-5 py-5 border-b border-gray-700 flex items-center gap-3">
          <span className="text-2xl">✈️</span>
          <div>
            <h1 className="text-lg font-bold leading-tight">Going Portal</h1>
            <p className="text-xs text-gray-400">Corporate</p>
          </div>
        </div>

        <nav className="flex-1 mt-4 px-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ href, label, icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <span className="text-base">{icon}</span>
                {label}
                {label === 'Approvals' && (
                  <span className="ml-auto bg-orange-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                    3
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
              {session?.user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">
                {session?.user?.email || 'User'}
              </p>
              <p className="text-xs text-gray-400">Super Admin</p>
            </div>
          </div>
          <button
            onClick={() =>
              signOut({ redirect: true, callbackUrl: '/auth/login' })
            }
            className="w-full px-4 py-2 text-xs bg-gray-800 text-gray-300 rounded-lg hover:bg-red-700 hover:text-white transition"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="bg-white shadow-sm shrink-0">
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
            <h2 className="text-base font-semibold text-gray-700">
              {NAV_ITEMS.find((n) => n.href === pathname)?.label ||
                'Corporate Portal'}
            </h2>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-gray-50">{children}</main>
      </div>
    </div>
  );
}
