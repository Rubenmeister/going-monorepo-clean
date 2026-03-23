'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

const NAV_ITEMS = [
  { href: '/empresas/dashboard',  label: 'Dashboard',      icon: '🏠' },
  { href: '/empresas/bookings',   label: 'Reservas',       icon: '📋' },
  { href: '/empresas/approvals',  label: 'Aprobaciones',   icon: '✅', badge: 3 },
  { href: '/empresas/tracking',   label: 'Seguimiento',    icon: '📍' },
  { href: '/empresas/reports',    label: 'Reportes',       icon: '📊' },
  { href: '/empresas/invoices',   label: 'Facturas',       icon: '🧾' },
  { href: '/empresas/settings',   label: 'Configuración',  icon: '⚙️' },
];

interface Props {
  children: React.ReactNode;
}

export default function EmpresasLayout({ children }: Props) {
  const pathname = usePathname();
  const router   = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userName, setUserName] = useState('Usuario');
  const [userEmail, setUserEmail] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('empresasToken') || localStorage.getItem('authToken');
    if (!token) {
      router.push('/empresas/auth/login');
      return;
    }
    // Decode JWT to get user info
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const name = [payload.firstName, payload.lastName].filter(Boolean).join(' ') || payload.email?.split('@')[0] || 'Usuario';
      setUserName(name);
      setUserEmail(payload.email || '');
    } catch {
      router.push('/empresas/auth/login');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('empresasToken');
    localStorage.removeItem('companyId');
    router.push('/empresas/auth/login');
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: '#ff4c41', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  const initial = userName.charAt(0).toUpperCase();

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:relative w-64 h-full z-50 flex flex-col transition-transform duration-200`}
        style={{ backgroundColor: '#011627' }}
      >
        {/* Logo */}
        <div className="px-5 py-4 flex items-center gap-3 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight" style={{ color: '#ff4c41' }}>Going</span>
              <span className="text-xs font-semibold text-white/50 uppercase tracking-widest">Empresas</span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>Portal Corporativo</p>
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
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  active ? 'text-white' : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
                style={active ? { backgroundColor: 'rgba(255,76,65,0.15)', color: '#ff4c41' } : {}}
              >
                <span className="text-base w-5 text-center flex-shrink-0">{icon}</span>
                <span className="flex-1">{label}</span>
                {badge && (
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: '#ff4c41' }}>
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User + logout */}
        <div className="p-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ backgroundColor: '#ff4c41' }}>
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{userName}</p>
              <p className="text-xs text-white/40 truncate">{userEmail}</p>
            </div>
            <button onClick={handleLogout} title="Cerrar sesión" className="text-white/30 hover:text-white/70 text-sm transition-colors">
              ↩
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar (mobile) */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-500 hover:text-gray-800 text-xl">☰</button>
          <span className="font-bold" style={{ color: '#ff4c41' }}>Going</span>
          <span className="text-xs text-gray-400 uppercase tracking-widest">Empresas</span>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
