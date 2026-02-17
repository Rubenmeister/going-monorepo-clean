'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: '📊' },
  { label: 'Services', href: '/services', icon: '🚗' },
  { label: 'Account', href: '/account', icon: '👤' },
  { label: 'Going Academy', href: '/academy', icon: '📚' },
  { label: 'SOS', href: '/sos', icon: '🚨' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 shadow-sm overflow-y-auto">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200 flex flex-col items-center justify-center">
        <Image
          src="/logo.svg"
          alt="Going Logo"
          width={120}
          height={120}
          className="mb-2"
          priority
        />
        <p className="text-xs text-gray-500 text-center mt-2">Ecuador Platform</p>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-going-primary text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-600 text-center">
          © 2026 Going Ecuador
        </p>
      </div>
    </aside>
  );
}
