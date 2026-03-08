'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDriver } from '../store';
import AppShell from '../components/AppShell';

const MENU = [
  { icon: '🚗', label: 'Mi vehículo', href: '#' },
  { icon: '📄', label: 'Mis documentos', href: '#' },
  { icon: '💰', label: 'Método de pago', href: '#' },
  { icon: '⭐', label: 'Mis calificaciones', href: '#' },
  { icon: '❓', label: 'Soporte', href: '#' },
];

export default function DriverProfilePage() {
  const { driver, token, isReady, init, logout } = useDriver();
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
      <div className="p-4">
        {/* Driver card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <div className="flex items-center gap-4 mb-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white flex-shrink-0"
              style={{ backgroundColor: '#011627' }}
            >
              {initials}
            </div>
            <div>
              <p className="font-bold text-gray-900">
                {driver.firstName} {driver.lastName}
              </p>
              <p className="text-sm text-gray-400">{driver.email}</p>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-yellow-400 text-sm">⭐ 4.8</span>
                <span className="text-xs text-gray-400">· 112 viajes</span>
              </div>
            </div>
          </div>

          {/* Vehicle info */}
          <div
            className="rounded-xl p-3 flex items-center gap-3"
            style={{ backgroundColor: '#f8fafc' }}
          >
            <span className="text-2xl">🚗</span>
            <div>
              <p className="text-xs text-gray-400">Vehículo registrado</p>
              <p className="text-sm font-semibold text-gray-900">
                Toyota Corolla 2020
              </p>
              <p className="text-xs text-gray-400">PBX-1234 · Blanco</p>
            </div>
            <div
              className="ml-auto px-2.5 py-1 rounded-full text-xs font-bold"
              style={{ backgroundColor: '#f0fdf4', color: '#22c55e' }}
            >
              Verificado
            </div>
          </div>
        </div>

        {/* Menu */}
        <div className="bg-white rounded-2xl shadow-sm mb-4 overflow-hidden">
          {MENU.map((item, i) => (
            <button
              key={item.label}
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
