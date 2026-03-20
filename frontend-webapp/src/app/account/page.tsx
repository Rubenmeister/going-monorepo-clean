'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.goingec.com/api';

async function authHeaders(): Promise<HeadersInit> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

interface RideHistory {
  tripId: string;
  pickup: { address: string };
  dropoff: { address: string };
  estimatedFare: number;
  finalFare?: number;
  distance?: number;
  status: string;
  createdAt: string;
  rideType?: string;
}

interface ParcelHistory {
  id: string;
  origin: { address: string };
  destination: { address: string };
  type: string;
  status: string;
  price: { amount: number };
  createdAt: string;
  trackingCode?: string;
}

const RIDE_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Esperando conductor', color: 'bg-yellow-100 text-yellow-700' },
  accepted: { label: 'Conductor asignado', color: 'bg-blue-100 text-blue-700' },
  in_progress: { label: 'En camino', color: 'bg-indigo-100 text-indigo-700' },
  completed: { label: 'Completado', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
};

const PARCEL_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Solicitado', color: 'bg-yellow-100 text-yellow-700' },
  assigned: { label: 'Conductor asignado', color: 'bg-blue-100 text-blue-700' },
  picked_up: { label: 'Recogido', color: 'bg-indigo-100 text-indigo-700' },
  in_transit: { label: 'En camino', color: 'bg-purple-100 text-purple-700' },
  delivered: { label: 'Entregado', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
};

const PARCEL_TYPE_LABELS: Record<string, string> = {
  document: '📄 Documento',
  small: '📦 Paquete pequeño',
  medium: '🛍️ Paquete mediano',
  large: '📫 Paquete grande',
};

export default function AccountPage() {
  const { auth } = useMonorepoApp();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');

  const [rides, setRides] = useState<RideHistory[]>([]);
  const [parcels, setParcels] = useState<ParcelHistory[]>([]);
  const [ridesLoading, setRidesLoading] = useState(false);
  const [parcelsLoading, setParcelsLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'rides' && auth.user) {
      setRidesLoading(true);
      authHeaders().then(headers =>
        fetch(`${API_BASE}/transport/rides?page=1&limit=20`, { headers })
          .then(r => r.ok ? r.json() : { rides: [] })
          .then(data => setRides(data.rides || data.data || []))
          .catch(() => setRides([]))
          .finally(() => setRidesLoading(false))
      );
    }
    if (activeTab === 'envios' && auth.user) {
      setParcelsLoading(true);
      authHeaders().then(headers =>
        fetch(`${API_BASE}/envios/parcels/my`, { headers })
          .then(r => r.ok ? r.json() : [])
          .then(data => setParcels(Array.isArray(data) ? data : data.parcels || []))
          .catch(() => setParcels([]))
          .finally(() => setParcelsLoading(false))
      );
    }
  }, [activeTab, auth.user]);

  if (!auth.user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center max-w-md w-full">
          <div className="text-6xl mb-4">🔐</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Acceso Requerido</h1>
          <p className="text-gray-500 mb-6">Inicia sesión para ver tu cuenta</p>
          <button
            onClick={() => router.push('/auth/login')}
            className="w-full py-3 bg-[#ff4c41] text-white rounded-xl font-bold hover:opacity-90 transition-opacity"
          >
            Iniciar Sesión
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: '👤 Perfil' },
    { id: 'rides', label: '🚗 Mis Viajes' },
    { id: 'envios', label: '📦 Mis Envíos' },
    { id: 'settings', label: '⚙️ Ajustes' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#ff4c41] rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
              {auth.user.firstName?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{auth.user.firstName || 'Usuario'}</h1>
              <p className="text-sm text-gray-500">{auth.user.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100 px-4">
        <div className="max-w-4xl mx-auto flex gap-1 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-4 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-[#ff4c41] text-[#ff4c41]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">

        {/* ─── Perfil ─── */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
            <h2 className="text-lg font-bold text-gray-900">Información de perfil</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1 block">Nombre</label>
                <input type="text" defaultValue={auth.user.firstName || ''} readOnly
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none" />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1 block">Email</label>
                <input type="email" defaultValue={auth.user.email || ''} readOnly
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none" />
              </div>
            </div>
            <div className="pt-2 flex gap-3">
              <Link href="/ride"
                className="flex-1 py-3 rounded-xl text-center text-white text-sm font-bold"
                style={{ backgroundColor: '#ff4c41' }}>
                🚗 Pedir viaje
              </Link>
              <Link href="/envios/cotizar"
                className="flex-1 py-3 rounded-xl text-center text-sm font-bold border-2"
                style={{ borderColor: '#ff4c41', color: '#ff4c41' }}>
                📦 Enviar paquete
              </Link>
            </div>
          </div>
        )}

        {/* ─── Mis Viajes ─── */}
        {activeTab === 'rides' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Historial de viajes</h2>
              <Link href="/ride"
                className="text-sm font-bold px-4 py-2 rounded-xl text-white"
                style={{ backgroundColor: '#ff4c41' }}>
                + Nuevo viaje
              </Link>
            </div>

            {ridesLoading && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
                <div className="inline-block w-8 h-8 border-2 border-[#ff4c41] border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-gray-500 text-sm">Cargando viajes...</p>
              </div>
            )}

            {!ridesLoading && rides.length === 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
                <div className="text-5xl mb-3">🚗</div>
                <p className="text-gray-700 font-semibold mb-1">Sin viajes aún</p>
                <p className="text-gray-400 text-sm mb-5">Pide tu primer viaje con Going</p>
                <Link href="/ride"
                  className="inline-block px-6 py-3 rounded-xl text-white font-bold text-sm"
                  style={{ backgroundColor: '#ff4c41' }}>
                  Reservar viaje
                </Link>
              </div>
            )}

            {!ridesLoading && rides.map(ride => {
              const st = RIDE_STATUS_LABELS[ride.status] || { label: ride.status, color: 'bg-gray-100 text-gray-600' };
              return (
                <div key={ride.tripId} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                        <span className="text-xs text-gray-400">{new Date(ride.createdAt).toLocaleDateString('es-EC')}</span>
                      </div>
                      <p className="text-sm text-gray-700 mb-1">
                        <span className="font-semibold">De:</span> {ride.pickup?.address || '—'}
                      </p>
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold">A:</span> {ride.dropoff?.address || '—'}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xl font-bold" style={{ color: '#ff4c41' }}>
                        ${(ride.finalFare ?? ride.estimatedFare ?? 0).toFixed(2)}
                      </p>
                      {ride.distance && (
                        <p className="text-xs text-gray-400 mt-0.5">{ride.distance.toFixed(1)} km</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ─── Mis Envíos ─── */}
        {activeTab === 'envios' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Mis envíos</h2>
              <Link href="/envios/cotizar"
                className="text-sm font-bold px-4 py-2 rounded-xl text-white"
                style={{ backgroundColor: '#ff4c41' }}>
                + Nuevo envío
              </Link>
            </div>

            {parcelsLoading && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
                <div className="inline-block w-8 h-8 border-2 border-[#ff4c41] border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-gray-500 text-sm">Cargando envíos...</p>
              </div>
            )}

            {!parcelsLoading && parcels.length === 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
                <div className="text-5xl mb-3">📦</div>
                <p className="text-gray-700 font-semibold mb-1">Sin envíos aún</p>
                <p className="text-gray-400 text-sm mb-5">Envía tu primer paquete con Going</p>
                <Link href="/envios/cotizar"
                  className="inline-block px-6 py-3 rounded-xl text-white font-bold text-sm"
                  style={{ backgroundColor: '#ff4c41' }}>
                  Cotizar envío
                </Link>
              </div>
            )}

            {!parcelsLoading && parcels.map(parcel => {
              const st = PARCEL_STATUS_LABELS[parcel.status] || { label: parcel.status, color: 'bg-gray-100 text-gray-600' };
              return (
                <div key={parcel.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                        <span className="text-xs text-gray-400">{new Date(parcel.createdAt).toLocaleDateString('es-EC')}</span>
                      </div>
                      <p className="text-xs text-gray-500 mb-1">{PARCEL_TYPE_LABELS[parcel.type] || parcel.type}</p>
                      <p className="text-sm text-gray-700 mb-1">
                        <span className="font-semibold">De:</span> {parcel.origin?.address || '—'}
                      </p>
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold">Para:</span> {parcel.destination?.address || '—'}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xl font-bold" style={{ color: '#ff4c41' }}>
                        ${(parcel.price?.amount ?? 0).toFixed(2)}
                      </p>
                      {parcel.trackingCode && (
                        <Link href={`/envios/tracking/${parcel.id}`}
                          className="text-xs mt-1 block font-semibold hover:underline"
                          style={{ color: '#ff4c41' }}>
                          Rastrear →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ─── Ajustes ─── */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Notificaciones</h2>
              <div className="space-y-3">
                {[
                  { label: 'Notificaciones por Email', enabled: true },
                  { label: 'Notificaciones por SMS', enabled: true },
                  { label: 'Ofertas y Promociones', enabled: false },
                  { label: 'Actualizaciones de viajes', enabled: true },
                ].map((s, i) => (
                  <label key={i} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 cursor-pointer">
                    <span className="text-sm text-gray-700 font-medium">{s.label}</span>
                    <input type="checkbox" defaultChecked={s.enabled} className="w-5 h-5 cursor-pointer accent-[#ff4c41]" />
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Seguridad</h2>
              <div className="space-y-3">
                <button className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 flex justify-between items-center hover:bg-gray-50 transition-colors">
                  <span>Cambiar Contraseña</span><span>→</span>
                </button>
                <button className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 flex justify-between items-center hover:bg-gray-50 transition-colors">
                  <span>Autenticación de Dos Factores</span><span>→</span>
                </button>
              </div>
            </div>

            <div className="bg-red-50 rounded-2xl border border-red-200 p-6">
              <h2 className="text-lg font-bold text-red-600 mb-2">⚠️ Zona de Peligro</h2>
              <p className="text-gray-600 text-sm mb-4">Esta acción es irreversible.</p>
              <button className="px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors">
                Eliminar Cuenta
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
