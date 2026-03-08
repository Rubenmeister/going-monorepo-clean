'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../store';
import AppShell from '../components/AppShell';

const MENU_SECTIONS = [
  {
    title: 'Mi cuenta',
    items: [
      { icon: '📋', label: 'Historial de reservas', href: '/bookings' },
      { icon: '⭐', label: 'Mis reseñas', href: '/reviews' },
      { icon: '🔔', label: 'Notificaciones', href: '#' },
    ],
  },
  {
    title: 'Seguridad',
    items: [
      { icon: '🔒', label: 'Cambiar contraseña', href: '/security' },
      { icon: '📱', label: 'Verificación en dos pasos', href: '#' },
    ],
  },
  {
    title: 'Emergencias',
    items: [
      { icon: '🚨', label: 'SOS — Emergencias', href: '/sos', danger: true },
      { icon: '📍', label: 'Compartir tracking', href: '/tracking' },
    ],
  },
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
      {/* Profile hero */}
      <div className="px-4 pt-6 pb-8" style={{ backgroundColor: '#011627' }}>
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white flex-shrink-0 shadow-lg"
            style={{ backgroundColor: '#ff4c41' }}
          >
            {initials}
          </div>
          <div>
            <h1 className="text-xl font-black text-white">
              {user.firstName} {user.lastName}
            </h1>
            <p className="text-sm text-white/50 mt-0.5">{user.email}</p>
            <div className="flex gap-1.5 mt-2">
              {user.roles.map((r) => (
                <span
                  key={r}
                  className="text-xs px-2.5 py-0.5 rounded-full font-bold capitalize"
                  style={{
                    backgroundColor: 'rgba(255,76,65,0.25)',
                    color: '#ff4c41',
                  }}
                >
                  {r}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          {[
            { value: '0', label: 'Reservas' },
            { value: '0', label: 'Reseñas' },
            { value: '⭐ –', label: 'Calificación' },
          ].map((s) => (
            <div
              key={s.label}
              className="text-center rounded-xl py-3 px-2"
              style={{ backgroundColor: 'rgba(255,255,255,0.07)' }}
            >
              <p className="font-black text-white text-base">{s.value}</p>
              <p className="text-xs text-white/40 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Menu sections */}
      <div className="px-4 py-4 space-y-5">
        {MENU_SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">
              {section.title}
            </p>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {section.items.map((item, i) => (
                <button
                  key={item.label}
                  onClick={() => item.href !== '#' && router.push(item.href)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-sm transition-colors hover:bg-gray-50"
                  style={{
                    borderBottom:
                      i < section.items.length - 1
                        ? '1px solid #f3f4f6'
                        : 'none',
                    color: (item as any).danger ? '#ef4444' : '#374151',
                  }}
                >
                  <span className="text-lg w-6 text-center">{item.icon}</span>
                  <span className="flex-1 text-left font-medium">
                    {item.label}
                  </span>
                  <span className="text-gray-300 text-base">›</span>
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Logout */}
        <button
          onClick={() => {
            logout();
            router.replace('/login');
          }}
          className="w-full py-3.5 rounded-2xl font-bold text-sm border"
          style={{
            backgroundColor: '#fef2f2',
            color: '#ef4444',
            borderColor: '#fee2e2',
          }}
        >
          🚪 Cerrar Sesión
        </button>

        <p className="text-center text-xs text-gray-300 pb-4">
          © 2026 Going Ecuador
        </p>
      </div>
    </AppShell>
  );
}
