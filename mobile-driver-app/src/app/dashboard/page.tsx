'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDriver } from '../store';
import AppShell from '../components/AppShell';

const MOCK_STATS = { trips: 5, earnings: 87.5, rating: 4.8 };

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
          className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: '#ff4c41', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  return (
    <AppShell>
      <div className="p-4">
        {/* Greeting */}
        <div className="mb-5">
          <h1 className="text-xl font-bold text-gray-900">
            Hola, {driver.firstName}! 🚗
          </h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-yellow-400">⭐</span>
            <span className="text-sm text-gray-500">
              {MOCK_STATS.rating} de calificación
            </span>
          </div>
        </div>

        {/* Online toggle */}
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">
            Estado de servicio
          </p>
          <div className="flex items-center justify-between">
            <div>
              <p
                className="font-bold text-lg"
                style={{ color: isOnline ? '#22c55e' : '#6b7280' }}
              >
                {isOnline ? '🟢 En línea' : '⚫ Fuera de línea'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {isOnline
                  ? 'Recibiendo solicitudes'
                  : 'No recibirás solicitudes'}
              </p>
            </div>
            <button
              onClick={toggleOnline}
              className="w-14 h-8 rounded-full transition-all duration-300 relative"
              style={{ backgroundColor: isOnline ? '#22c55e' : '#d1d5db' }}
            >
              <span
                className="absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all duration-300"
                style={{ left: isOnline ? '30px' : '2px' }}
              />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            {
              label: 'Viajes hoy',
              value: MOCK_STATS.trips,
              icon: '🚗',
              color: '#ff4c41',
            },
            {
              label: 'Ganado hoy',
              value: `$${MOCK_STATS.earnings}`,
              icon: '💰',
              color: '#22c55e',
            },
            {
              label: 'Calificación',
              value: MOCK_STATS.rating,
              icon: '⭐',
              color: '#f59e0b',
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-2xl p-3 shadow-sm text-center"
            >
              <span className="text-xl">{s.icon}</span>
              <p className="font-bold text-lg mt-1" style={{ color: s.color }}>
                {s.value}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Incoming job or empty */}
        {isOnline ? (
          hasJob ? (
            <div
              className="bg-white rounded-2xl p-4 shadow-sm border-2"
              style={{ borderColor: '#ff4c41' }}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="font-bold text-gray-900">Nueva Solicitud 🔔</p>
                <span
                  className="text-sm font-bold"
                  style={{ color: '#22c55e' }}
                >
                  {MOCK_JOB.fare}
                </span>
              </div>
              <div className="space-y-1.5 mb-4">
                <p className="text-xs text-gray-500">👤 {MOCK_JOB.passenger}</p>
                <p className="text-xs text-gray-700">📍 {MOCK_JOB.origin}</p>
                <p className="text-xs text-gray-700">
                  🏁 {MOCK_JOB.destination}
                </p>
                <p className="text-xs text-gray-500">
                  {MOCK_JOB.distance} · ETA {MOCK_JOB.eta}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setHasJob(false)}
                  className="py-2.5 rounded-xl font-bold text-sm"
                  style={{ backgroundColor: '#f3f4f6', color: '#6b7280' }}
                >
                  Rechazar
                </button>
                <button
                  onClick={() => {
                    setHasJob(false);
                    router.push('/trip');
                  }}
                  className="py-2.5 rounded-xl font-bold text-sm text-white"
                  style={{ backgroundColor: '#ff4c41' }}
                >
                  Aceptar
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
              <span className="text-4xl mb-3 block">📡</span>
              <p className="font-semibold text-gray-700 mb-1">
                Esperando solicitudes
              </p>
              <p className="text-sm text-gray-400">
                Te notificaremos cuando haya un viaje disponible
              </p>
              <button
                onClick={() => setHasJob(true)}
                className="mt-4 px-4 py-2 rounded-xl text-xs font-bold text-white"
                style={{ backgroundColor: '#ff4c41' }}
              >
                Simular solicitud
              </button>
            </div>
          )
        ) : (
          <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
            <span className="text-4xl mb-3 block">💤</span>
            <p className="font-semibold text-gray-700 mb-1">
              Estás fuera de servicio
            </p>
            <p className="text-sm text-gray-400">
              Actívate para empezar a recibir solicitudes
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
