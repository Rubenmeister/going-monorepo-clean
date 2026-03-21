'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDriver } from '../store';
import AppShell from '../components/AppShell';

const MENU_SECTIONS = [
  {
    title: 'Mi cuenta',
    items: [
      { icon: '🚗', label: 'Mi vehículo', href: '#' },
      { icon: '📄', label: 'Mis documentos', href: '#' },
      { icon: '⭐', label: 'Mis calificaciones', href: '/ratings' },
      { icon: '📋', label: 'Historial de viajes', href: '/trip' },
    ],
  },
  {
    title: 'Finanzas',
    items: [
      { icon: '💰', label: 'Mis ganancias', href: '/earnings' },
      { icon: '💳', label: 'Método de cobro', href: '#' },
    ],
  },
  {
    title: 'Ayuda',
    items: [
      { icon: '❓', label: 'Soporte', href: '/support' },
      { icon: '📞', label: 'Contacto emergencia', href: '#', danger: true },
    ],
  },
];

export default function DriverProfilePage() {
  const { driver, token, isReady, init, logout, isOnline } = useDriver();
  const router = useRouter();

  useEffect(() => {
    init();
  }, [init]);
  useEffect(() => {
    if (isReady && !token) router.replace('/login');
  }, [isReady, token, router]);

  if (!driver) return null;

  const initials = `${driver.firstName?.[0] ?? ''}${
    driver.lastName?.[0] ?? ''
  }`.toUpperCase();

  return (
    <AppShell title="Perfil">
      {/* Dark hero */}
      <div
        className="px-5 py-8 relative overflow-hidden"
        style={{ backgroundColor: '#011627' }}
      >
        <div
          className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-10"
          style={{ backgroundColor: '#ff4c41' }}
        />
        <div
          className="absolute -bottom-5 -left-5 w-24 h-24 rounded-full opacity-5"
          style={{ backgroundColor: '#ff4c41' }}
        />

        <div className="flex items-center gap-4 mb-5">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white flex-shrink-0"
            style={{ backgroundColor: '#ff4c41' }}
          >
            {initials}
          </div>
          <div>
            <h1 className="text-xl font-black text-white">
              {driver.firstName} {driver.lastName}
            </h1>
            <p className="text-sm text-white/50 mt-0.5">{driver.email}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span
                className="px-2 py-0.5 rounded-full text-xs font-bold"
                style={{
                  backgroundColor: 'rgba(255,76,65,0.2)',
                  color: '#ff4c41',
                }}
              >
                Conductor
              </span>
              <span
                className="px-2 py-0.5 rounded-full text-xs font-bold"
                style={
                  isOnline
                    ? {
                        backgroundColor: 'rgba(34,197,94,0.2)',
                        color: '#4ade80',
                      }
                    : {
                        backgroundColor: 'rgba(107,114,128,0.2)',
                        color: '#9ca3af',
                      }
                }
              >
                {isOnline ? 'En línea' : 'Fuera de línea'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Viajes', value: '112', icon: '🚗' },
            { label: 'Calific.', value: '4.8 ⭐', icon: '' },
            { label: 'Activo', value: '6 meses', icon: '📅' },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl py-3 px-2 text-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
            >
              <p className="font-black text-white text-sm">{s.value}</p>
              <p className="text-xs text-white/40 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Vehicle banner */}
      <div className="mx-4 mt-4 rounded-2xl p-3 flex items-center gap-3 bg-white shadow-sm">
        <span className="text-2xl">🚗</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400">Vehículo registrado</p>
          <p className="text-sm font-bold text-gray-900">
            Toyota Corolla 2020 · PBX-1234
          </p>
        </div>
        <span
          className="px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0"
          style={{ backgroundColor: '#f0fdf4', color: '#22c55e' }}
        >
          Verificado
        </span>
      </div>

      {/* Menu sections */}
      <div className="px-4 py-4 space-y-4">
        {MENU_SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
              {section.title}
            </p>
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {section.items.map((item, i) => (
                <button
                  key={item.label}
                  onClick={() => item.href !== '#' && router.push(item.href)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors"
                  style={
                    i < section.items.length - 1
                      ? { borderBottom: '1px solid #f3f4f6' }
                      : {}
                  }
                >
                  <span className="text-lg w-6 text-center">{item.icon}</span>
                  <span
                    className="flex-1 text-left text-sm font-medium"
                    style={{
                      color: (item as any).danger ? '#ef4444' : '#374151',
                    }}
                  >
                    {item.label}
                  </span>
                  <span className="text-gray-300">›</span>
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
          className="w-full py-3.5 rounded-2xl font-bold text-sm"
          style={{ backgroundColor: '#fef2f2', color: '#ef4444' }}
        >
          Cerrar Sesión
        </button>
      </div>
    </AppShell>
  );
}
