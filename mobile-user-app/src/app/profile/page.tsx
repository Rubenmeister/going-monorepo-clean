'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../store';
import AppShell from '../components/AppShell';

const MENU = [
  { icon: '📋', label: 'Historial de reservas', href: '/bookings' },
  { icon: '⭐', label: 'Mis reseñas', href: '#' },
  { icon: '🔔', label: 'Notificaciones', href: '#' },
  { icon: '🔒', label: 'Seguridad', href: '#' },
  { icon: '❓', label: 'Ayuda y soporte', href: '#' },
];

export default function ProfilePage() {
  const { user, token, isReady, init, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    init();
  }, [init]);
  useEffect(() => {
    if (isReady && !token) router.replace('/login');
  }, [isReady, token, router]);

  if (!user) return null;

  const initials = `${user.firstName?.[0] ?? ''}${
    user.lastName?.[0] ?? ''
  }`.toUpperCase();

  return (
    <AppShell title="Perfil">
      <div className="p-4">
        {/* Avatar + info */}
        <div className="flex items-center gap-4 bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white flex-shrink-0"
            style={{ backgroundColor: '#ff4c41' }}
          >
            {initials}
          </div>
          <div>
            <p className="font-bold text-gray-900">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-sm text-gray-400">{user.email}</p>
            <div className="flex gap-1 mt-1">
              {user.roles.map((r) => (
                <span
                  key={r}
                  className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
                  style={{ backgroundColor: '#fff0ef', color: '#ff4c41' }}
                >
                  {r}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Menu */}
        <div className="bg-white rounded-2xl shadow-sm mb-4 overflow-hidden">
          {MENU.map((item, i) => (
            <button
              key={item.label}
              onClick={() => item.href !== '#' && router.push(item.href)}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              style={
                i < MENU.length - 1 ? { borderBottom: '1px solid #f3f4f6' } : {}
              }
            >
              <span className="text-lg">{item.icon}</span>
              <span className="flex-1 text-left">{item.label}</span>
              <span className="text-gray-300">›</span>
            </button>
          ))}
        </div>

        {/* Logout */}
        <button
          onClick={() => {
            logout();
            router.replace('/login');
          }}
          className="w-full py-3 rounded-2xl font-bold text-sm"
          style={{ backgroundColor: '#fef2f2', color: '#ef4444' }}
        >
          Cerrar Sesión
        </button>
      </div>
    </AppShell>
  );
}
