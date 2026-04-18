'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import dynamicImport from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';
import { AdminLayout } from '../components';
import { useAdminSocket } from '../../lib/useAdminSocket';

/* ─── Types ─────────────────────────────────────────────────── */

export interface ActiveDriver {
  driverId: string;
  latitude: number;
  longitude: number;
  updatedAt: string;
  status?: string;
}

interface DriverRecord {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  roles: string[];
  status: 'active' | 'suspended' | 'pending' | 'pending_verification' | 'inactive';
  createdAt: string;
  // campos extendidos — disponibles si el backend los retorna
  cedula?: string;
  province?: string;
  city?: string;
  rating?: number;
  totalTrips?: number;
  tripsThisMonth?: number;
  totalEarnings?: number;
  commissionRate?: number;
  pendingPayout?: number;
  lastActive?: string;
  vehiclePlate?: string;
  vehicleType?: string;
}

type Tab = 'gestion' | 'realtime';

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'gestion',  label: 'Gestión',     icon: '👥' },
  { key: 'realtime', label: 'Tiempo Real', icon: '🗺️' },
];

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  active:               { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Activo'     },
  suspended:            { bg: 'bg-red-100',    text: 'text-red-700',    label: 'Suspendido' },
  pending:              { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pendiente'  },
  pending_verification: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pendiente'  },
  inactive:             { bg: 'bg-gray-100',   text: 'text-gray-500',   label: 'Inactivo'   },
};

function statusStyle(s: string) {
  return STATUS_STYLES[s] ?? { bg: 'bg-gray-100', text: 'text-gray-500', label: s };
}

function timeSince(iso: string) {
  const secs = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return `${secs}s`;
  if (secs < 3600) return `${Math.round(secs / 60)}m`;
  return `${Math.round(secs / 3600)}h`;
}

const DriversMap = dynamicImport(() => import('../components/DriversMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-xl">
      <p className="text-gray-400 text-sm">Cargando mapa…</p>
    </div>
  ),
});

/* ─── Page ───────────────────────────────────────────────────── */

export default function DriversPage() {
  const { auth, domain } = useMonorepoApp();
  const router = useRouter();

  const [tab, setTab]                   = useState<Tab>('gestion');
  const [drivers, setDrivers]           = useState<DriverRecord[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null as string | null);
  const [updatingId, setUpdatingId]     = useState(null as string | null);
  const [search, setSearch]             = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedDriver, setSelectedDriver] = useState(null as DriverRecord | null);

  const [activeDrivers, setActiveDrivers] = useState<ActiveDriver[]>([]);
  const [gpsLoading, setGpsLoading]       = useState(false);

  /* ── Socket: GPS en tiempo real ── */
  const { status: socketStatus } = useAdminSocket({
    onDriverLocation: (loc) => {
      setActiveDrivers(prev => {
        const idx = prev.findIndex(d => d.driverId === loc.driverId);
        const updated: ActiveDriver = {
          driverId: loc.driverId,
          latitude: loc.latitude,
          longitude: loc.longitude,
          updatedAt: loc.updatedAt ?? new Date().toISOString(),
          status: loc.status,
        };
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updated;
          return next;
        }
        return [...prev, updated];
      });
    },
  });

  /* ── Auth guard ── */
  useEffect(() => {
    if (!auth.isLoading && !auth.user) router.push('/login');
  }, [auth.isLoading, auth.user, router]);

  /* ── Fetch drivers from API ── */
  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await domain.admin.getUsers({ role: 'driver', limit: 200 });
      const list: DriverRecord[] = (res.users ?? []).map((u: any) => ({
        id:         u.id ?? u._id,
        firstName:  u.firstName ?? u.name?.split(' ')[0] ?? '—',
        lastName:   u.lastName  ?? u.name?.split(' ').slice(1).join(' ') ?? '',
        email:      u.email ?? '—',
        phone:      u.phone ?? '—',
        roles:      u.roles ?? ['driver'],
        status:     u.status ?? 'pending',
        createdAt:  u.createdAt ?? '',
        // campos opcionales del backend
        cedula:       u.cedula,
        province:     u.province,
        city:         u.city,
        rating:       u.rating,
        totalTrips:   u.totalTrips,
        tripsThisMonth: u.tripsThisMonth,
        totalEarnings:  u.totalEarnings,
        commissionRate: u.commissionRate ?? 15,
        pendingPayout:  u.pendingPayout,
        lastActive:     u.lastActive ?? u.updatedAt,
        vehiclePlate:   u.vehiclePlate,
        vehicleType:    u.vehicleType,
      }));
      setDrivers(list);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al cargar conductores');
    } finally {
      setLoading(false);
    }
  }, [domain.admin]);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  /* ── GPS real-time ── */
  const fetchGPS = useCallback(async () => {
    setGpsLoading(true);
    try {
      const data = await domain.tracking.getActiveDrivers();
      setActiveDrivers(Array.isArray(data) ? data : (data as any)?.drivers ?? []);
    } catch { /* silencioso */ }
    finally { setGpsLoading(false); }
  }, [domain.tracking]);

  useEffect(() => {
    if (tab === 'realtime') {
      fetchGPS(); // carga inicial
      /* Polling como fallback: solo cada 60s si el socket no está conectado */
      const id = setInterval(() => {
        if (socketStatus !== 'connected') fetchGPS();
      }, 60_000);
      return () => clearInterval(id);
    }
  }, [tab, fetchGPS, socketStatus]);

  /* ── Status change ── */
  const handleStatusChange = async (driver: DriverRecord, newStatus: string) => {
    setUpdatingId(driver.id);
    try {
      await domain.admin.updateUserStatus(driver.id, newStatus);
      setDrivers((prev) =>
        prev.map((d) => d.id === driver.id ? { ...d, status: newStatus as DriverRecord['status'] } : d)
      );
      if (selectedDriver?.id === driver.id) {
        setSelectedDriver((prev) => prev ? { ...prev, status: newStatus as DriverRecord['status'] } : null);
      }
    } catch (e: unknown) {
      alert(`Error: ${e instanceof Error ? e.message : 'No se pudo actualizar el estado'}`);
    } finally {
      setUpdatingId(null);
    }
  };

  /* ── Filter ── */
  const filtered = drivers.filter((d) => {
    const q = search.toLowerCase();
    const matchQ = !q || `${d.firstName} ${d.lastName} ${d.email} ${d.cedula ?? ''}`
      .toLowerCase().includes(q);
    const matchStatus = filterStatus === 'all' || d.status === filterStatus;
    return matchQ && matchStatus;
  });

  const counts = {
    total:     drivers.length,
    active:    drivers.filter((d) => d.status === 'active').length,
    suspended: drivers.filter((d) => d.status === 'suspended').length,
    pending:   drivers.filter((d) => ['pending', 'pending_verification'].includes(d.status)).length,
  };

  /* ─────────────────────── RENDER ─────────────────────────── */
  return (
    <AdminLayout userName={auth.user?.firstName ?? 'Admin'} onLogout={auth.logout}>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Conductores</h1>
          <p className="text-gray-500 text-sm mt-0.5">Gestión de conductores Going</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button onClick={fetchDrivers} className="underline font-semibold">Reintentar</button>
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Total',        value: counts.total,     color: '#0033A0' },
          { label: 'Activos',      value: counts.active,    color: '#16a34a' },
          { label: 'Suspendidos',  value: counts.suspended, color: '#ef4444' },
          { label: 'Pendientes',   value: counts.pending,   color: '#f59e0b' },
          { label: 'GPS en vivo',  value: activeDrivers.length, color: '#8b5cf6' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500">{s.label}</p>
            {loading
              ? <div className="h-8 w-12 bg-gray-100 animate-pulse rounded mt-1" />
              : <p className="text-2xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
            }
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* ─── TAB: GESTIÓN ─── */}
      {tab === 'gestion' && (
        <div>
          {/* Filters */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4 flex flex-wrap gap-3">
            <input
              type="text"
              placeholder="Buscar nombre, email, cédula…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-[200px] px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activo</option>
              <option value="suspended">Suspendido</option>
              <option value="pending">Pendiente</option>
              <option value="pending_verification">Pend. verificación</option>
              <option value="inactive">Inactivo</option>
            </select>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <div className="w-8 h-8 border-4 border-[#ff4c41] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Cargando conductores…</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Conductor', 'Contacto', 'Ciudad', 'Estado', 'Vehículo', 'Acciones'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((d) => {
                    const s = statusStyle(d.status);
                    const isUpdating = updatingId === d.id;
                    return (
                      <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                              style={{ background: 'linear-gradient(135deg,#0033A0,#ff4c41)' }}
                            >
                              {d.firstName[0]}{d.lastName[0] ?? ''}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{d.firstName} {d.lastName}</p>
                              <p className="text-xs text-gray-400">{d.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">
                          <p>{d.phone}</p>
                          {d.cedula && <p className="font-mono text-gray-400">{d.cedula}</p>}
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-sm">
                          {d.city && d.province ? `${d.city}, ${d.province}` : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${s.bg} ${s.text}`}>
                            {s.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">
                          {d.vehiclePlate
                            ? <><p className="font-mono">{d.vehiclePlate}</p><p className="text-gray-400">{d.vehicleType}</p></>
                            : <span className="text-gray-300">—</span>
                          }
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setSelectedDriver(d)}
                              className="px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                              Ver
                            </button>
                            {isUpdating ? (
                              <span className="px-2 py-1 text-xs text-gray-400">…</span>
                            ) : d.status === 'active' ? (
                              <button
                                onClick={() => handleStatusChange(d, 'suspended')}
                                className="px-2 py-1 text-xs font-medium bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                              >
                                Suspender
                              </button>
                            ) : d.status === 'suspended' ? (
                              <button
                                onClick={() => handleStatusChange(d, 'active')}
                                className="px-2 py-1 text-xs font-medium bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                              >
                                Activar
                              </button>
                            ) : ['pending', 'pending_verification'].includes(d.status) ? (
                              <button
                                onClick={() => handleStatusChange(d, 'active')}
                                className="px-2 py-1 text-xs font-medium bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                              >
                                Aprobar
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
            {!loading && filtered.length === 0 && (
              <div className="p-8 text-center text-gray-400">
                {search || filterStatus !== 'all'
                  ? 'No se encontraron conductores con esos filtros.'
                  : 'No hay conductores registrados aún.'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB: TIEMPO REAL ─── */}
      {tab === 'realtime' && (
        <div>
          {/* Indicador de socket */}
          <div className={`mb-4 flex items-center gap-2 text-xs px-3 py-2 rounded-xl w-fit font-medium ${
            socketStatus === 'connected'    ? 'bg-green-50 text-green-700'
            : socketStatus === 'connecting' ? 'bg-yellow-50 text-yellow-700'
            : 'bg-gray-100 text-gray-500'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              socketStatus === 'connected'    ? 'bg-green-400'
              : socketStatus === 'connecting' ? 'bg-yellow-400 animate-pulse'
              : 'bg-gray-400'
            }`} />
            {socketStatus === 'connected'
              ? 'GPS en tiempo real vía WebSocket'
              : socketStatus === 'connecting'
              ? 'Conectando WebSocket…'
              : 'Modo polling (sin WebSocket)'}
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'En línea',    value: activeDrivers.length,                                                            color: '#16a34a' },
              { label: 'Disponibles', value: activeDrivers.filter((d) => !d.status || d.status === 'available').length,       color: '#0033A0' },
              { label: 'En viaje',    value: activeDrivers.filter((d) => d.status === 'busy').length,                         color: '#f59e0b' },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="text-3xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div
              className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
              style={{ height: 500 }}
            >
              {activeDrivers.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-5xl mb-3">🗺️</p>
                    <p className="text-gray-400">Sin conductores GPS activos</p>
                  </div>
                </div>
              ) : (
                <DriversMap drivers={activeDrivers} />
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">GPS en vivo</h3>
                <button
                  onClick={fetchGPS}
                  className="text-xs text-white px-3 py-1.5 rounded-lg"
                  style={{ backgroundColor: '#ff4c41' }}
                >
                  {gpsLoading ? '…' : 'Actualizar'}
                </button>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                {activeDrivers.length === 0 ? (
                  <div className="p-6 text-center text-gray-400 text-sm">Sin conductores activos</div>
                ) : (
                  activeDrivers.map((d) => (
                    <div key={d.driverId} className="p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-900">{d.driverId.slice(0, 8)}…</p>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            d.status === 'busy' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {d.status ?? 'disponible'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Lat {d.latitude?.toFixed(4)} · Lng {d.longitude?.toFixed(4)}
                      </p>
                      <p className="text-xs text-gray-400">Hace {timeSince(d.updatedAt)}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL DETALLE ─── */}
      {selectedDriver && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-lg font-bold"
                  style={{ background: 'linear-gradient(135deg,#0033A0,#ff4c41)' }}
                >
                  {selectedDriver.firstName[0]}{selectedDriver.lastName[0] ?? ''}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {selectedDriver.firstName} {selectedDriver.lastName}
                  </h2>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusStyle(selectedDriver.status).bg} ${statusStyle(selectedDriver.status).text}`}
                  >
                    {statusStyle(selectedDriver.status).label}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedDriver(null)} className="text-gray-400 hover:text-gray-700 text-2xl">×</button>
            </div>

            <div className="p-6 grid grid-cols-2 gap-4">
              {[
                ['Email',         selectedDriver.email],
                ['Teléfono',      selectedDriver.phone],
                ['Cédula',        selectedDriver.cedula    ?? '—'],
                ['Ciudad',        selectedDriver.city      ?? '—'],
                ['Provincia',     selectedDriver.province  ?? '—'],
                ['Placa',         selectedDriver.vehiclePlate ?? '—'],
                ['Vehículo',      selectedDriver.vehicleType  ?? '—'],
                ['Conductor desde', selectedDriver.createdAt
                  ? new Date(selectedDriver.createdAt).toLocaleDateString('es-EC')
                  : '—'],
                ['Último activo', selectedDriver.lastActive
                  ? new Date(selectedDriver.lastActive).toLocaleDateString('es-EC')
                  : '—'],
                ['Calificación',  selectedDriver.rating != null ? `⭐ ${selectedDriver.rating}` : '—'],
                ['Viajes totales', selectedDriver.totalTrips != null ? String(selectedDriver.totalTrips) : '—'],
                ['Este mes',      selectedDriver.tripsThisMonth != null ? String(selectedDriver.tripsThisMonth) : '—'],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="text-xs text-gray-400 mb-0.5">{k}</p>
                  <p className="text-sm font-semibold text-gray-900">{v}</p>
                </div>
              ))}
            </div>

            {/* Ver perfil completo */}
            <div className="px-6 pb-2">
              <button
                onClick={() => router.push(`/drivers/${selectedDriver.id}`)}
                className="w-full py-2.5 text-sm font-bold text-white rounded-xl transition-colors"
                style={{ backgroundColor: '#0033A0' }}
              >
                Ver perfil completo →
              </button>
            </div>

            {/* Acciones rápidas en modal */}
            <div className="px-6 pb-6 flex gap-3">
              {updatingId === selectedDriver.id ? (
                <span className="text-sm text-gray-400">Actualizando…</span>
              ) : selectedDriver.status === 'active' ? (
                <button
                  onClick={() => handleStatusChange(selectedDriver, 'suspended')}
                  className="px-4 py-2 text-sm font-bold bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                >
                  Suspender conductor
                </button>
              ) : selectedDriver.status === 'suspended' ? (
                <button
                  onClick={() => handleStatusChange(selectedDriver, 'active')}
                  className="px-4 py-2 text-sm font-bold bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors"
                >
                  Reactivar conductor
                </button>
              ) : ['pending', 'pending_verification'].includes(selectedDriver.status) ? (
                <>
                  <button
                    onClick={() => handleStatusChange(selectedDriver, 'active')}
                    className="px-4 py-2 text-sm font-bold bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors"
                  >
                    Aprobar
                  </button>
             