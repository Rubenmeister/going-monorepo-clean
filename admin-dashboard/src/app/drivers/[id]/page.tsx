'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';
import { AdminLayout } from '../../components';
import { adminFetch, API } from '../../../lib/admin-api';

/* ─── Types ─────────────────────────────────────────────────────────── */
interface DriverUser {
  id: string;
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  status: string;
  createdAt: string;
  cedula?: string;
  province?: string;
  city?: string;
  vehiclePlate?: string;
  vehicleType?: string;
  profilePicture?: string;
  rating?: number;
  totalTrips?: number;
}

interface Trip {
  id: string;
  origin: string | null;
  destination: string | null;
  date: string;
  amount: number;
  status: string;
  duration: number | null;
  distanceKm: number | null;
  paymentMethod: string | null;
  modalidad: string;
}

interface RatingSummary {
  average: number;
  total: number;
  breakdown: Record<number, number>;
}

interface ActiveDriver {
  driverId: string;
  latitude: number;
  longitude: number;
  updatedAt: string;
  status?: string;
}

/* ─── Helpers ────────────────────────────────────────────────────────── */
const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  active:               { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Activo'      },
  suspended:            { bg: 'bg-red-100',    text: 'text-red-700',    label: 'Suspendido'  },
  pending:              { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pendiente'   },
  pending_verification: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Verificando' },
  inactive:             { bg: 'bg-gray-100',   text: 'text-gray-500',   label: 'Inactivo'    },
};

const TRIP_STATUS_STYLE: Record<string, string> = {
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  pending:   'bg-yellow-100 text-yellow-700',
  active:    'bg-blue-100 text-blue-700',
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
}

/* ─── Page ───────────────────────────────────────────────────────────── */
export default function DriverProfilePage() {
  const { auth, domain }    = useMonorepoApp();
  const router              = useRouter();
  const params              = useParams();
  const driverId            = params?.id as string;

  const [driver,      setDriver]      = useState<DriverUser | null>(null);
  const [trips,       setTrips]       = useState<Trip[]>([]);
  const [ratings,     setRatings]     = useState<RatingSummary | null>(null);
  const [gpsPos,      setGpsPos]      = useState<ActiveDriver | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [tripsPage,   setTripsPage]   = useState(1);
  const [tripsMeta,   setTripsMeta]   = useState({ total: 0, totalPages: 1 });
  const [activeSection, setActiveSection] = useState<'info' | 'trips' | 'ratings'>('info');

  useEffect(() => {
    if (!auth.isLoading && !auth.user) router.push('/login');
  }, [auth.isLoading, auth.user, router]);

  /* ── Fetch all data ── */
  const load = useCallback(async () => {
    if (!driverId) return;
    setLoading(true);
    const token = localStorage.getItem('authToken') ?? '';
    try {
      /* 1. User profile */
      const usersRes = await adminFetch<any>(`/auth/admin/users?role=driver&limit=200`, token).catch(() => null);
      const userList: DriverUser[] = usersRes?.users ?? usersRes?.data ?? (Array.isArray(usersRes) ? usersRes : []);
      const found = userList.find(u => u.id === driverId || (u as any)._id === driverId);
      if (found) setDriver(found);

      /* 2. Trip history */
      const tripsRes = await fetch(`${API}/rides/history/driver/${driverId}?limit=20&page=${tripsPage}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.ok ? r.json() : null).catch(() => null);

      if (tripsRes?.data) {
        setTrips(tripsRes.data);
        setTripsMeta({ total: tripsRes.meta?.total ?? 0, totalPages: tripsRes.meta?.totalPages ?? 1 });
      }

      /* 3. GPS position */
      const activeDrivers = await domain.tracking.getActiveDrivers().catch(() => []);
      const arr: ActiveDriver[] = Array.isArray(activeDrivers) ? activeDrivers : (activeDrivers as any)?.drivers ?? [];
      const pos = arr.find(d => d.driverId === driverId);
      if (pos) setGpsPos(pos);

    } catch { /* silencioso */ } finally {
      setLoading(false);
    }
  }, [driverId, tripsPage, domain.tracking]);

  useEffect(() => { if (auth.user && driverId) load(); }, [auth.user, driverId, load]);

  /* ── Status change ── */
  const handleStatus = async (newStatus: 'active' | 'suspended') => {
    if (!driver) return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem('authToken') ?? '';
      await adminFetch(`/auth/admin/users/${driverId}/status`, token, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setDriver(prev => prev ? { ...prev, status: newStatus } : null);
    } catch { alert('No se pudo actualizar el estado'); }
    finally { setActionLoading(false); }
  };

  /* ── Render ── */
  if (loading) {
    return (
      <AdminLayout userName={auth.user?.firstName ?? 'Admin'} onLogout={auth.logout}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-40 bg-gray-100 rounded-2xl" />
          <div className="h-64 bg-gray-100 rounded-2xl" />
        </div>
      </AdminLayout>
    );
  }

  if (!driver) {
    return (
      <AdminLayout userName={auth.user?.firstName ?? 'Admin'} onLogout={auth.logout}>
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">🔍</p>
          <p className="font-semibold">Conductor no encontrado</p>
          <button onClick={() => router.push('/drivers')} className="mt-4 text-sm text-blue-600 underline">Volver a conductores</button>
        </div>
      </AdminLayout>
    );
  }

  const statusStyle = STATUS_STYLE[driver.status] ?? { bg: 'bg-gray-100', text: 'text-gray-500', label: driver.status };
  const initials    = `${driver.firstName[0]}${driver.lastName?.[0] ?? ''}`.toUpperCase();
  const totalEarnings = trips.filter(t => t.status === 'completed').reduce((s, t) => s + t.amount, 0);
  const completedTrips = trips.filter(t => t.status === 'completed').length;

  const SECTIONS = [
    { key: 'info',    label: 'Información', icon: '👤' },
    { key: 'trips',   label: `Viajes (${tripsMeta.total})`, icon: '🚗' },
    { key: 'ratings', label: 'Calificaciones', icon: '⭐' },
  ] as const;

  return (
    <AdminLayout userName={auth.user?.firstName ?? 'Admin'} onLogout={auth.logout}>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-5">
        <button onClick={() => router.push('/drivers')} className="hover:text-gray-700 transition-colors">Conductores</button>
        <span>/</span>
        <span className="text-gray-700 font-semibold">{driver.firstName} {driver.lastName}</span>
      </div>

      {/* ── Profile header ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-black text-white flex-shrink-0"
            style={{ backgroundColor: '#0033A0' }}>
            {initials}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="text-2xl font-black text-gray-900">{driver.firstName} {driver.lastName}</h1>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusStyle.bg} ${statusStyle.text}`}>{statusStyle.label}</span>
              {gpsPos && (
                <span className="flex items-center gap-1 text-xs font-semibold bg-green-50 text-green-700 px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  En línea ahora
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">{driver.email}</p>
            {driver.phone && <p className="text-sm text-gray-400">{driver.phone}</p>}
          </div>

          {/* Quick KPIs */}
          <div className="flex gap-4 flex-shrink-0">
            {[
              { label: 'Viajes',    value: tripsMeta.total || driver.totalTrips || '—' },
              { label: 'Rating',    value: driver.rating ? `⭐ ${driver.rating}` : '—' },
              { label: 'Ingresos',  value: totalEarnings > 0 ? `$${totalEarnings.toFixed(0)}` : '—' },
            ].map(k => (
              <div key={k.label} className="text-center bg-gray-50 rounded-xl px-4 py-2">
                <p className="text-lg font-black text-gray-900">{k.value}</p>
                <p className="text-xs text-gray-400">{k.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 mt-5 pt-4 border-t border-gray-100">
          {driver.status === 'active' && (
            <button disabled={actionLoading} onClick={() => handleStatus('suspended')}
              className="px-4 py-2 text-sm font-bold bg-red-50 text-red-600 rounded-xl hover:bg-red-100 disabled:opacity-60 transition-colors">
              {actionLoading ? 'Procesando…' : 'Suspender conductor'}
            </button>
          )}
          {driver.status === 'suspended' && (
            <button disabled={actionLoading} onClick={() => handleStatus('active')}
              className="px-4 py-2 text-sm font-bold text-white rounded-xl disabled:opacity-60 transition-colors"
              style={{ backgroundColor: '#16a34a' }}>
              {actionLoading ? 'Procesando…' : 'Reactivar conductor'}
            </button>
          )}
          {(driver.status === 'pending' || driver.status === 'pending_verification') && (
            <>
              <button disabled={actionLoading} onClick={() => handleStatus('active')}
                className="px-4 py-2 text-sm font-bold text-white rounded-xl disabled:opacity-60"
                style={{ backgroundColor: '#16a34a' }}>
                {actionLoading ? '…' : 'Aprobar'}
              </button>
              <button disabled={actionLoading} onClick={() => handleStatus('suspended')}
                className="px-4 py-2 text-sm font-bold bg-red-50 text-red-600 rounded-xl hover:bg-red-100 disabled:opacity-60">
                Rechazar
              </button>
            </>
          )}
          <button onClick={() => router.push('/drivers')}
            className="px-4 py-2 text-sm font-semibold text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors ml-auto">
            ← Volver
          </button>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5 w-fit">
        {SECTIONS.map(s => (
          <button key={s.key} onClick={() => setActiveSection(s.key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeSection === s.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {/* ── SECTION: INFO ── */}
      {activeSection === 'info' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Personal data */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Datos personales</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                ['Nombre',    `${driver.firstName} ${driver.lastName ?? ''}`],
                ['Email',     driver.email],
                ['Teléfono',  driver.phone ?? '—'],
                ['Cédula',    driver.cedula ?? '—'],
                ['Ciudad',    driver.city ?? '—'],
                ['Provincia', driver.province ?? '—'],
                ['Desde',     driver.createdAt ? fmt(driver.createdAt) : '—'],
                ['Estado',    statusStyle.label],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="text-xs text-gray-400 mb-0.5">{k}</p>
                  <p className="text-sm font-semibold text-gray-900 break-all">{v}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Vehicle */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Vehículo</h3>
            {driver.vehiclePlate || driver.vehicleType ? (
              <div className="grid grid-cols-2 gap-4">
                {[
                  ['Placa',   driver.vehiclePlate ?? '—'],
                  ['Tipo',    driver.vehicleType ?? '—'],
                ].map(([k, v]) => (
                  <div key={k}>
                    <p className="text-xs text-gray-400 mb-0.5">{k}</p>
                    <p className="text-sm font-semibold text-gray-900">{v}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Sin datos de vehículo registrados.</p>
            )}

            {/* GPS */}
            {gpsPos && (
              <div className="mt-5 pt-4 border-t border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Ubicación actual (GPS)</p>
                <div className="flex items-center gap-3">
                  <div className="bg-blue-50 rounded-xl px-3 py-2 text-xs font-mono text-blue-700">
                    {gpsPos.latitude.toFixed(5)}, {gpsPos.longitude.toFixed(5)}
                  </div>
                  <a
                    href={`https://maps.google.com/?q=${gpsPos.latitude},${gpsPos.longitude}`}
                    target="_blank" rel="noopener noreferrer"
                    className="text-xs text-blue-600 underline">
                    Ver en Maps
                  </a>
                </div>
                <p className="text-xs text-gray-400 mt-1">Actualizado: {fmtTime(gpsPos.updatedAt)}</p>
              </div>
            )}
          </div>

          {/* Summary stats */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Resumen de actividad</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Viajes registrados',  value: tripsMeta.total,       unit: '',    color: '#0033A0' },
                { label: 'Viajes completados',  value: completedTrips,        unit: '',    color: '#16a34a' },
                { label: 'Ingresos (visible)',  value: `$${totalEarnings.toFixed(2)}`, unit: '', color: '#f59e0b' },
                { label: 'Tasa completación',   value: tripsMeta.total > 0 ? `${((completedTrips / tripsMeta.total) * 100).toFixed(1)}%` : '—', unit: '', color: '#8b5cf6' },
              ].map(k => (
                <div key={k.label} className="text-center bg-gray-50 rounded-xl p-4">
                  <p className="text-2xl font-black mt-1" style={{ color: k.color }}>{k.value}{k.unit}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{k.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION: TRIPS ── */}
      {activeSection === 'trips' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-900">Historial de viajes</h3>
            <span className="text-sm text-gray-400">{tripsMeta.total} total</span>
          </div>
          {trips.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-3xl mb-2">🚗</p>
              <p className="text-sm">Sin viajes registrados</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Fecha', 'Origen', 'Destino', 'Distancia', 'Duración', 'Monto', 'Pago', 'Estado'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {trips.map(t => (
                      <tr key={t.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                          <p>{fmt(t.date)}</p>
                          <p className="text-xs text-gray-400">{fmtTime(t.date)}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-700 max-w-[140px] truncate">{t.origin ?? '—'}</td>
                        <td className="px-4 py-3 text-gray-700 max-w-[140px] truncate">{t.destination ?? '—'}</td>
                        <td className="px-4 py-3 text-gray-500">{t.distanceKm ? `${t.distanceKm.toFixed(1)} km` : '—'}</td>
                        <td className="px-4 py-3 text-gray-500">{t.duration ? `${t.duration} min` : '—'}</td>
                        <td className="px-4 py-3 font-bold text-gray-900">{t.amount > 0 ? `$${t.amount.toFixed(2)}` : '—'}</td>
                        <td className="px-4 py-3 text-gray-500 capitalize">{t.paymentMethod ?? '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TRIP_STATUS_STYLE[t.status] ?? 'bg-gray-100 text-gray-500'}`}>
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              {tripsMeta.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-sm text-gray-400">Página {tripsPage} de {tripsMeta.totalPages}</span>
                  <div className="flex gap-2">
                    <button disabled={tripsPage <= 1} onClick={() => setTripsPage(p => p - 1)}
                      className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 text-gray-600 disabled:opacity-40 hover:bg-gray-200 transition-colors">
                      ← Anterior
                    </button>
                    <button disabled={tripsPage >= tripsMeta.totalPages} onClick={() => setTripsPage(p => p + 1)}
                      className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 text-gray-600 disabled:opacity-40 hover:bg-gray-200 transition-colors">
                      Siguiente →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── SECTION: RATINGS ── */}
      {activeSection === 'ratings' && (
        <div className="space-y-4">
          {/* Rating from trips */}
          {trips.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Calificación del conductor</h3>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-5xl font-black text-yellow-500">{driver.rating?.toFixed(1) ?? '—'}</p>
                  <p className="text-sm text-gray-400 mt-1">de 5.0</p>
                </div>
                <div className="flex-1">
                  {[5, 4, 3, 2, 1].map(star => {
                    const pct = 70 - (5 - star) * 15;
                    return (
                      <div key={star} className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs text-gray-500 w-4">{star}★</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-2">
                          <div className="h-2 rounded-full bg-yellow-400" style={{ width: `${Math.max(pct, 2)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700">
                💡 El desglose exacto estará disponible cuando el backend exponga <code>GET /admin/drivers/{'{id}'}/ratings</code>.
              </div>
            </div>
          )}

          {trips.length === 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center text-gray-400">
              <p className="text-3xl mb-2">⭐</p>
              <p className="text-sm">Sin datos de calificaciones disponibles</p>
            </div>
          )}
        </div>
      )}

    </AdminLayout>
  );
}
