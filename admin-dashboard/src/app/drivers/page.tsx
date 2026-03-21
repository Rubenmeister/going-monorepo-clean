'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import dynamicImport from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';
import { AdminLayout } from '../components';

export interface ActiveDriver {
  driverId: string;
  latitude: number;
  longitude: number;
  updatedAt: string;
  status?: string;
}

// Dynamically import the Leaflet map (browser-only)
const DriversMap = dynamicImport(() => import('../components/DriversMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-xl">
      <div className="text-center">
        <div className="text-4xl mb-2">🗺️</div>
        <p className="text-gray-500 text-sm">Cargando mapa...</p>
      </div>
    </div>
  ),
});

const STATUS_COLOR: Record<string, string> = {
  available: 'bg-green-100 text-green-700',
  busy: 'bg-yellow-100 text-yellow-700',
  offline: 'bg-gray-100 text-gray-500',
};

function timeSince(iso: string) {
  const secs = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return `${secs}s`;
  if (secs < 3600) return `${Math.round(secs / 60)}m`;
  return `${Math.round(secs / 3600)}h`;
}

export default function DriversPage() {
  const { auth, domain } = useMonorepoApp();
  const router = useRouter();
  const [drivers, setDrivers] = useState<ActiveDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<ActiveDriver | null>(
    null
  );

  useEffect(() => {
    if (!auth.isLoading && !auth.user) router.push('/login');
  }, [auth.isLoading, auth.user, router]);

  const fetchDrivers = useCallback(async () => {
    try {
      const data = await domain.tracking.getActiveDrivers();
      setDrivers(Array.isArray(data) ? data : (data as any)?.drivers ?? []);
      setLastRefresh(new Date());
    } catch {
      // keep previous data silently
    } finally {
      setLoading(false);
    }
  }, [domain.tracking]);

  useEffect(() => {
    fetchDrivers();
    const interval = setInterval(fetchDrivers, 30_000);
    return () => clearInterval(interval);
  }, [fetchDrivers]);

  if (auth.isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-3 animate-pulse">🚗</div>
          <p className="text-gray-500">Cargando conductores...</p>
        </div>
      </div>
    );
  }

  const activeCount = drivers.length;
  const availableCount = drivers.filter(
    (d) => (d.status ?? 'available') === 'available'
  ).length;
  const busyCount = drivers.filter((d) => d.status === 'busy').length;

  return (
    <AdminLayout
      userName={auth.user?.firstName ?? 'Admin'}
      onLogout={auth.logout}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Conductores en Tiempo Real
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Seguimiento GPS en vivo · auto-actualiza cada 30 s
          </p>
        </div>
        <div className="flex items-center gap-4">
          {lastRefresh && (
            <span className="text-xs text-gray-400">
              Actualizado: {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchDrivers}
            className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors"
            style={{ backgroundColor: '#ff4c41' }}
          >
            Actualizar
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 font-medium">
            Conductores activos
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{activeCount}</p>
          <p className="text-xs mt-1 text-green-600">En linea ahora</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 font-medium">Disponibles</p>
          <p className="text-3xl font-bold text-green-600 mt-1">
            {availableCount}
          </p>
          <p className="text-xs mt-1 text-gray-400">Sin viaje asignado</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 font-medium">En viaje</p>
          <p className="text-3xl font-bold text-yellow-500 mt-1">{busyCount}</p>
          <p className="text-xs mt-1 text-gray-400">Viaje en curso</p>
        </div>
      </div>

      {/* Map + List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div
          className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
          style={{ height: '520px' }}
        >
          {activeCount === 0 ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-5xl mb-3">🗺️</div>
                <p className="text-gray-500 font-medium">
                  Sin conductores activos
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  Los conductores aparecen aqui cuando estan en linea
                </p>
              </div>
            </div>
          ) : (
            <DriversMap drivers={drivers} />
          )}
        </div>

        {/* Driver List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">
              Lista de conductores
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {activeCount} activos
            </p>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {drivers.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">
                Sin conductores activos
              </div>
            ) : (
              drivers.map((driver) => (
                <button
                  key={driver.driverId}
                  onClick={() => setSelectedDriver(driver)}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                    selectedDriver?.driverId === driver.driverId
                      ? 'bg-red-50 border-l-4 border-red-400'
                      : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                        style={{ backgroundColor: '#ff4c41' }}
                      >
                        🚗
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {driver.driverId.slice(0, 8)}...
                        </p>
                        <p className="text-xs text-gray-400">
                          Actualizado: {timeSince(driver.updatedAt)}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        STATUS_COLOR[driver.status ?? 'available'] ??
                        STATUS_COLOR['available']
                      }`}
                    >
                      {driver.status ?? 'disponible'}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-gray-400">
                    Lat {driver.latitude?.toFixed(4)} · Lng{' '}
                    {driver.longitude?.toFixed(4)}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Selected Driver Detail */}
      {selectedDriver && (
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">
              Detalle del conductor
            </h3>
            <button
              onClick={() => setSelectedDriver(null)}
              className="text-gray-400 hover:text-gray-600 text-xl"
            >
              x
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">ID</p>
              <p className="font-mono text-gray-900 break-all">
                {selectedDriver.driverId}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Latitud</p>
              <p className="font-semibold">{selectedDriver.latitude}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Longitud</p>
              <p className="font-semibold">{selectedDriver.longitude}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">
                Ultima actualizacion
              </p>
              <p className="font-semibold">
                {new Date(selectedDriver.updatedAt).toLocaleString('es-CO')}
              </p>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
