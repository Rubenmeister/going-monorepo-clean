import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'block' : 'hidden'
        } md:block w-64 bg-gray-900 text-white overflow-y-auto fixed md:relative h-full z-50`}
      >
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-2xl font-bold">Going Portal</h1>
        </div>

        <nav className="mt-6 space-y-2 px-4">
          <Link
            href="/dashboard"
            className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            Dashboard
          </Link>
          <Link
            href="/bookings"
            className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            Bookings
          </Link>
          <Link
            href="/approvals"
            className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            Approvals
          </Link>
          <Link
            href="/tracking"
            className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            Tracking
          </Link>
          <Link
            href="/reports"
            className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            Reports
          </Link>
          <Link
            href="/settings"
            className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            Settings
          </Link>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium">{session?.user?.email}</p>
              <p className="text-xs text-gray-400">Signed in</p>
            </div>
          </div>
          <button
            onClick={() =>
              signOut({ redirect: true, callbackUrl: '/auth/login' })
            }
            className="w-full px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="flex items-center justify-between px-6 py-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden text-gray-700"
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
            <h2 className="text-xl font-semibold text-gray-800">
              Corporate Portal
            </h2>
            <div className="w-6"></div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto bg-gray-50">{children}</main>
      </div>
    </div>
  );
}
