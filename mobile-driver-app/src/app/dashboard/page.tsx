'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDriver } from '../store';
import AppShell from '../components/AppShell';

const MOCK_STATS = { trips: 5, earnings: 87.5, rating: 4.8, hours: 3.2 };

const MOCK_JOB = {
  id: 'job_1',
  passenger: 'Ana Martínez',
  origin: 'Av. Amazonas N21-147',
  destination: 'Aeropuerto Mariscal Sucre',
  distance: '18 km',
  fare: '$12.50',
  eta: '3 min',
};

export default function DashboardPage() {
  const { driver, token, isReady, init, isOnline, toggleOnline } = useDriver();
  const router = useRouter();
  const [hasJob, setHasJob] = useState(false);

  useEffect(() => {
    init();
  }, [init]);
  useEffect(() => {
    if (isReady && !token) router.replace('/login');
  }, [isReady, token, router]);

  if (!isReady || !driver) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: '#011627' }}
      >
        <div
          className="w-8 h-8 border-4 rounded-full animate-spin"
          style={{ borderColor: '#ff4c41', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  return (
    <AppShell>
      {/* Hero */}
      <div
        className="px-5 py-8 relative overflow-hidden"
        style={{ backgroundColor: '#011627' }}
      >
        {/* decorative circles */}
        <div
          className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-10"
          style={{ backgroundColor: '#ff4c41' }}
        />
        <div
          className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full opacity-5"
          style={{ backgroundColor: '#ff4c41' }}
        />

        <p className="text-white/50 text-sm mb-1">Bienvenido de vuelta</p>
        <h1 className="text-2xl font-black text-white mb-1">
          {driver.firstName} {driver.lastName}
        </h1>
        <div className="flex items-center gap-1.5 mb-5">
          <span className="text-yellow-400 text-sm">⭐</span>
          <span className="text-sm text-white/60">
            {MOCK_STATS.rating} · Conductor verificado
          </span>
        </div>

        {/* Online toggle row */}
        <div className="flex items-center justify-between bg-white/10 rounded-2xl px-4 py-3 backdrop-blur-sm">
          <div>
            <p className="font-bold text-white text-sm">Estado de servicio</p>
            <p
              className="text-xs mt-0.5"
              style={{ color: isOnline ? '#4ade80' : '#9ca3af' }}
            >
              {isOnline
                ? '● Recibiendo solicitudes'
                : '● No recibirás solicitudes'}
            </p>
          </div>
          <button
            onClick={toggleOnline}
            className="w-14 h-8 rounded-full transition-all duration-300 relative flex-shrink-0"
            style={{ backgroundColor: isOnline ? '#22c55e' : '#374151' }}
          >
            <span
              className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300"
              style={{ left: isOnline ? '30px' : '2px' }}
            />
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-4 border-b border-gray-100 bg-white">
        {[
          { label: 'Viajes', value: MOCK_STATS.trips, icon: '🚗' },
          { label: 'Ganado', value: `$${MOCK_STATS.earnings}`, icon: '💰' },
          { label: 'Calific.', value: MOCK_STATS.rating, icon: '⭐' },
          { label: 'Horas', value: MOCK_STATS.hours, icon: '⏱' },
        ].map((s) => (
          <div
            key={s.label}
            className="flex flex-col items-center py-4 border-r border-gray-100 last:border-0"
          >
            <span className="text-xl mb-1">{s.icon}</span>
            <p className="font-black text-gray-900 text-sm">{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Incoming job or waiting */}
        {isOnline ? (
          hasJob ? (
            <div
              className="bg-white rounded-2xl p-4 shadow-sm border-2"
              style={{ borderColor: '#ff4c41' }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🔔</span>
                  <p className="font-bold text-gray-900">Nueva Solicitud</p>
                </div>
                <span
                  className="font-black text-base"
                  style={{ color: '#22c55e' }}
                >
                  {MOCK_JOB.fare}
                </span>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 mb-4 space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-sm mt-0.5">👤</span>
                  <p className="text-sm font-medium text-gray-700">
                    {MOCK_JOB.passenger}
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-sm mt-0.5">📍</span>
                  <p className="text-sm text-gray-600">{MOCK_JOB.origin}</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-sm mt-0.5">🏁</span>
                  <p className="text-sm text-gray-600">
                    {MOCK_JOB.destination}
                  </p>
                </div>
                <p className="text-xs text-gray-400 pl-6">
                  {MOCK_JOB.distance} · ETA {MOCK_JOB.eta}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setHasJob(false)}
                  className="py-3 rounded-xl font-bold text-sm"
                  style={{ backgroundColor: '#f3f4f6', color: '#6b7280' }}
                >
                  Rechazar
                </button>
                <button
                  onClick={() => {
                    setHasJob(false);
                    router.push('/trip');
                  }}
                  className="py-3 rounded-xl font-bold text-sm text-white"
                  style={{ backgroundColor: '#ff4c41' }}
                >
                  Aceptar
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
              <span className="text-5xl mb-3 block">📡</span>
              <p className="font-bold text-gray-700 mb-1">
                Esperando solicitudes
              </p>
              <p className="text-sm text-gray-400 mb-4">
                Te notificaremos cuando haya un viaje disponible
              </p>
              <button
                onClick={() => setHasJob(true)}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ backgroundColor: '#ff4c41' }}
              >
                Simular solicitud
              </button>
            </div>
          )
        ) : (
          <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
            <span className="text-5xl mb-3 block">💤</span>
            <p className="font-bold text-gray-700 mb-1">
              Estás fuera de servicio
            </p>
            <p className="text-sm text-gray-400">
              Actívate para empezar a recibir solicitudes
            </p>
          </div>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: '📋', label: 'Ver historial', href: '/trip' },
            { icon: '💰', label: 'Mis ganancias', href: '/earnings' },
            { icon: '⭐', label: 'Calificaciones', href: '/ratings' },
            { icon: '👤', label: 'Mi perfil', href: '/profile' },
          ].map((a) => (
            <button
              key={a.label}
              onClick={() => router.push(a.href)}
              className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3 hover:shadow-md transition-shadow text-left"
            >
              <span className="text-xl">{a.icon}</span>
              <span className="text-sm font-bold text-gray-700">{a.label}</span>
            </button>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
