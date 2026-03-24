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

interface DriverRecord {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  cedula: string;
  province: string;
  city: string;
  status: 'active' | 'suspended' | 'pending' | 'inactive';
  rating: number;
  totalTrips: number;
  tripsThisMonth: number;
  totalEarnings: number;
  commissionRate: number;
  pendingPayout: number;
  joinedAt: string;
  lastActive: string;
  vehiclePlate: string;
  vehicleType: string;
  coursesCompleted: number;
  totalCourses: number;
}

interface Course {
  id: string;
  title: string;
  level: string;
  duration: string;
  completed: number;
  total: number;
}

const MOCK_DRIVERS: DriverRecord[] = [
  { id: 'd1', firstName: 'Carlos', lastName: 'Moreira', email: 'carlos.moreira@email.com', phone: '+593 99 123 4567', cedula: '1712345678', province: 'Pichincha', city: 'Quito', status: 'active', rating: 4.8, totalTrips: 342, tripsThisMonth: 28, totalEarnings: 4820.50, commissionRate: 15, pendingPayout: 380.00, joinedAt: '2024-03-15', lastActive: '2026-03-24', vehiclePlate: 'PBJ-1234', vehicleType: 'SUV', coursesCompleted: 4, totalCourses: 5 },
  { id: 'd2', firstName: 'María', lastName: 'Tipán', email: 'maria.tipan@email.com', phone: '+593 98 234 5678', cedula: '1801234567', province: 'Tungurahua', city: 'Ambato', status: 'active', rating: 4.9, totalTrips: 218, tripsThisMonth: 19, totalEarnings: 3210.00, commissionRate: 15, pendingPayout: 245.00, joinedAt: '2024-06-01', lastActive: '2026-03-24', vehiclePlate: 'TBQ-5678', vehicleType: 'Sedán', coursesCompleted: 5, totalCourses: 5 },
  { id: 'd3', firstName: 'Jorge', lastName: 'Salazar', email: 'jorge.salazar@email.com', phone: '+593 97 345 6789', cedula: '0912345678', province: 'Guayas', city: 'Guayaquil', status: 'active', rating: 4.5, totalTrips: 510, tripsThisMonth: 41, totalEarnings: 7340.00, commissionRate: 15, pendingPayout: 520.00, joinedAt: '2023-11-20', lastActive: '2026-03-24', vehiclePlate: 'GBR-9012', vehicleType: 'Van', coursesCompleted: 3, totalCourses: 5 },
  { id: 'd4', firstName: 'Ana', lastName: 'Flores', email: 'ana.flores@email.com', phone: '+593 96 456 7890', cedula: '0102345678', province: 'Azuay', city: 'Cuenca', status: 'suspended', rating: 3.9, totalTrips: 87, tripsThisMonth: 0, totalEarnings: 1240.00, commissionRate: 15, pendingPayout: 0, joinedAt: '2025-01-10', lastActive: '2026-02-15', vehiclePlate: 'AZB-3456', vehicleType: 'Sedán', coursesCompleted: 2, totalCourses: 5 },
  { id: 'd5', firstName: 'Luis', lastName: 'Cando', email: 'luis.cando@email.com', phone: '+593 95 567 8901', cedula: '1005678901', province: 'Cotopaxi', city: 'Latacunga', status: 'pending', rating: 0, totalTrips: 0, tripsThisMonth: 0, totalEarnings: 0, commissionRate: 15, pendingPayout: 0, joinedAt: '2026-03-20', lastActive: '2026-03-20', vehiclePlate: 'COT-7890', vehicleType: 'SUV', coursesCompleted: 1, totalCourses: 5 },
  { id: 'd6', firstName: 'Rosa', lastName: 'Quishpe', email: 'rosa.quishpe@email.com', phone: '+593 94 678 9012', cedula: '1756789012', province: 'Pichincha', city: 'Quito', status: 'active', rating: 4.7, totalTrips: 195, tripsThisMonth: 22, totalEarnings: 2890.00, commissionRate: 15, pendingPayout: 310.00, joinedAt: '2024-09-05', lastActive: '2026-03-23', vehiclePlate: 'PCH-2345', vehicleType: 'Sedán', coursesCompleted: 4, totalCourses: 5 },
];

const COURSES: Course[] = [
  { id: 'c1', title: 'Cómo maximizar tus ganancias', level: 'Básico', duration: '45 min', completed: 5, total: 6 },
  { id: 'c2', title: 'Atención al cliente de excelencia', level: 'Intermedio', duration: '1.5 hrs', completed: 4, total: 6 },
  { id: 'c3', title: 'Manejo seguro y eficiente', level: 'Avanzado', duration: '2 hrs', completed: 3, total: 6 },
  { id: 'c4', title: 'Conoce el Ecuador: rutas turísticas', level: 'Básico', duration: '1 hr', completed: 3, total: 6 },
  { id: 'c5', title: 'Seguridad vial y primeros auxilios', level: 'Avanzado', duration: '3 hrs', completed: 2, total: 6 },
];

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  active:    { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Activo'     },
  suspended: { bg: 'bg-red-100',    text: 'text-red-700',    label: 'Suspendido' },
  pending:   { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pendiente'  },
  inactive:  { bg: 'bg-gray-100',   text: 'text-gray-500',   label: 'Inactivo'   },
};

const DriversMap = dynamicImport(() => import('../components/DriversMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-xl">
      <p className="text-gray-400 text-sm">Cargando mapa…</p>
    </div>
  ),
});

function timeSince(iso: string) {
  const secs = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return `${secs}s`;
  if (secs < 3600) return `${Math.round(secs / 60)}m`;
  return `${Math.round(secs / 3600)}h`;
}

type Tab = 'realtime' | 'gestion' | 'finanzas' | 'capacitacion';

export default function DriversPage() {
  const { auth, domain } = useMonorepoApp();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('gestion');
  const [activeDrivers, setActiveDrivers] = useState<ActiveDriver[]>([]);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterProvince, setFilterProvince] = useState('all');
  const [selectedDriver, setSelectedDriver] = useState<DriverRecord | null>(null);

  useEffect(() => {
    if (!auth.isLoading && !auth.user) router.push('/login');
  }, [auth.isLoading, auth.user, router]);

  const fetchGPS = useCallback(async () => {
    setGpsLoading(true);
    try {
      const data = await domain.tracking.getActiveDrivers();
      setActiveDrivers(Array.isArray(data) ? data : (data as any)?.drivers ?? []);
    } catch { /* silent */ }
    finally { setGpsLoading(false); }
  }, [domain.tracking]);

  useEffect(() => {
    if (tab === 'realtime') {
      fetchGPS();
      const id = setInterval(fetchGPS, 30_000);
      return () => clearInterval(id);
    }
  }, [tab, fetchGPS]);

  const provinces = Array.from(new Set(MOCK_DRIVERS.map(d => d.province))).sort();

  const filtered = MOCK_DRIVERS.filter(d => {
    const q = search.toLowerCase();
    const matchQ = !q || `${d.firstName} ${d.lastName} ${d.cedula} ${d.email}`.toLowerCase().includes(q);
    const matchStatus = filterStatus === 'all' || d.status === filterStatus;
    const matchProv = filterProvince === 'all' || d.province === filterProvince;
    return matchQ && matchStatus && matchProv;
  });

  const totalEarnings = MOCK_DRIVERS.reduce((s, d) => s + d.totalEarnings, 0);
  const totalCommission = MOCK_DRIVERS.reduce((s, d) => s + d.totalEarnings * d.commissionRate / 100, 0);
  const totalPending = MOCK_DRIVERS.reduce((s, d) => s + d.pendingPayout, 0);

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: 'gestion',       label: 'Gestión',      icon: '👥' },
    { key: 'realtime',      label: 'Tiempo Real',  icon: '🗺️' },
    { key: 'finanzas',      label: 'Finanzas',     icon: '💰' },
    { key: 'capacitacion',  label: 'Capacitación', icon: '🎓' },
  ];

  return (
    <AdminLayout userName={auth.user?.firstName ?? 'Admin'} onLogout={auth.logout}>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Conductores</h1>
          <p className="text-gray-500 text-sm mt-0.5">Control total de conductores Going</p>
        </div>
        <button
          className="px-4 py-2 text-sm font-bold text-white rounded-xl transition-colors"
          style={{ backgroundColor: '#ff4c41' }}
          onClick={() => alert('Invitar conductor — próximamente')}
        >
          + Agregar conductor
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Total', value: MOCK_DRIVERS.length, color: '#0033A0' },
          { label: 'Activos', value: MOCK_DRIVERS.filter(d => d.status === 'active').length, color: '#16a34a' },
          { label: 'Suspendidos', value: MOCK_DRIVERS.filter(d => d.status === 'suspended').length, color: '#ef4444' },
          { label: 'Pendientes', value: MOCK_DRIVERS.filter(d => d.status === 'pending').length, color: '#f59e0b' },
          { label: 'GPS en vivo', value: activeDrivers.length, color: '#8b5cf6' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        {TABS.map(t => (
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
              type="text" placeholder="Buscar nombre, cédula, email…"
              value={search} onChange={e => setSearch(e.target.value)}
              className="flex-1 min-w-[200px] px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
            />
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none">
              <option value="all">Todos los estados</option>
              <option value="active">Activo</option>
              <option value="suspended">Suspendido</option>
              <option value="pending">Pendiente</option>
              <option value="inactive">Inactivo</option>
            </select>
            <select value={filterProvince} onChange={e => setFilterProvince(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none">
              <option value="all">Todas las provincias</option>
              {provinces.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Conductor', 'Cédula', 'Ciudad', 'Estado', 'Viajes', 'Calificación', 'Vehículo', 'Acciones'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(d => {
                  const s = STATUS_STYLES[d.status];
                  return (
                    <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                            style={{ background: 'linear-gradient(135deg,#0033A0,#ff4c41)' }}>
                            {d.firstName[0]}{d.lastName[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{d.firstName} {d.lastName}</p>
                            <p className="text-xs text-gray-400">{d.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 font-mono text-xs">{d.cedula}</td>
                      <td className="px-4 py-3 text-gray-600">{d.city}, {d.province}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${s.bg} ${s.text}`}>{s.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900">{d.totalTrips}</p>
                        <p className="text-xs text-gray-400">{d.tripsThisMonth} este mes</p>
                      </td>
                      <td className="px-4 py-3">
                        {d.rating > 0
                          ? <span className="font-bold text-yellow-600">⭐ {d.rating}</span>
                          : <span className="text-gray-400 text-xs">Sin calificaciones</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        <p className="font-mono">{d.vehiclePlate}</p>
                        <p className="text-gray-400">{d.vehicleType}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => setSelectedDriver(d)}
                            className="px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                            Ver
                          </button>
                          {d.status === 'active'
                            ? <button className="px-2 py-1 text-xs font-medium bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors">Suspender</button>
                            : d.status === 'suspended'
                            ? <button className="px-2 py-1 text-xs font-medium bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors">Activar</button>
                            : d.status === 'pending'
                            ? <button className="px-2 py-1 text-xs font-medium bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors">Aprobar</button>
                            : null
                          }
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="p-8 text-center text-gray-400">No se encontraron conductores con esos filtros.</div>
            )}
          </div>

          {/* Driver Detail Modal */}
          {selectedDriver && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-lg font-bold"
                      style={{ background: 'linear-gradient(135deg,#0033A0,#ff4c41)' }}>
                      {selectedDriver.firstName[0]}{selectedDriver.lastName[0]}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{selectedDriver.firstName} {selectedDriver.lastName}</h2>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[selectedDriver.status].bg} ${STATUS_STYLES[selectedDriver.status].text}`}>
                        {STATUS_STYLES[selectedDriver.status].label}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => setSelectedDriver(null)} className="text-gray-400 hover:text-gray-700 text-2xl">×</button>
                </div>
                <div className="p-6 grid grid-cols-2 gap-4">
                  {[
                    ['Email', selectedDriver.email],
                    ['Teléfono', selectedDriver.phone],
                    ['Cédula', selectedDriver.cedula],
                    ['Provincia', selectedDriver.province],
                    ['Ciudad', selectedDriver.city],
                    ['Placa', selectedDriver.vehiclePlate],
                    ['Vehículo', selectedDriver.vehicleType],
                    ['Desde', new Date(selectedDriver.joinedAt).toLocaleDateString('es-EC')],
                    ['Último activo', new Date(selectedDriver.lastActive).toLocaleDateString('es-EC')],
                    ['Calificación', selectedDriver.rating > 0 ? `⭐ ${selectedDriver.rating}` : 'Sin calificaciones'],
                    ['Viajes totales', selectedDriver.totalTrips.toString()],
                    ['Viajes este mes', selectedDriver.tripsThisMonth.toString()],
                    ['Ingresos totales', `$${selectedDriver.totalEarnings.toFixed(2)}`],
                    ['Comisión Going (15%)', `$${(selectedDriver.totalEarnings * 0.15).toFixed(2)}`],
                    ['Pendiente de pago', `$${selectedDriver.pendingPayout.toFixed(2)}`],
                    ['Capacitación', `${selectedDriver.coursesCompleted}/${selectedDriver.totalCourses} cursos`],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <p className="text-xs text-gray-400 mb-0.5">{k}</p>
                      <p className="text-sm font-semibold text-gray-900">{v}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB: TIEMPO REAL GPS ─── */}
      {tab === 'realtime' && (
        <div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'En línea', value: activeDrivers.length, color: '#16a34a' },
              { label: 'Disponibles', value: activeDrivers.filter(d => (d.status ?? 'available') === 'available').length, color: '#0033A0' },
              { label: 'En viaje', value: activeDrivers.filter(d => d.status === 'busy').length, color: '#f59e0b' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="text-3xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden" style={{ height: 500 }}>
              {activeDrivers.length === 0
                ? <div className="w-full h-full flex items-center justify-center"><div className="text-center"><p className="text-5xl mb-3">🗺️</p><p className="text-gray-400">Sin conductores GPS activos</p></div></div>
                : <DriversMap drivers={activeDrivers} />
              }
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">GPS en vivo</h3>
                <button onClick={fetchGPS} className="text-xs text-white px-3 py-1.5 rounded-lg" style={{ backgroundColor: '#ff4c41' }}>
                  {gpsLoading ? '…' : 'Actualizar'}
                </button>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                {activeDrivers.length === 0
                  ? <div className="p-6 text-center text-gray-400 text-sm">Sin conductores activos</div>
                  : activeDrivers.map(d => (
                    <div key={d.driverId} className="p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-900">{d.driverId.slice(0, 8)}…</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${d.status === 'busy' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                          {d.status ?? 'disponible'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Lat {d.latitude?.toFixed(4)} · Lng {d.longitude?.toFixed(4)}</p>
                      <p className="text-xs text-gray-400">Hace {timeSince(d.updatedAt)}</p>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB: FINANZAS ─── */}
      {tab === 'finanzas' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Ingresos totales conductores', value: `$${totalEarnings.toLocaleString('es-EC', { minimumFractionDigits: 2 })}`, icon: '💵', color: '#0033A0' },
              { label: 'Comisión Going (15%)', value: `$${totalCommission.toLocaleString('es-EC', { minimumFractionDigits: 2 })}`, icon: '📊', color: '#16a34a' },
              { label: 'Liquidaciones pendientes', value: `$${totalPending.toLocaleString('es-EC', { minimumFractionDigits: 2 })}`, icon: '⏳', color: '#f59e0b' },
              { label: 'Conductores con pendiente', value: MOCK_DRIVERS.filter(d => d.pendingPayout > 0).length, icon: '🧾', color: '#8b5cf6' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <p className="text-2xl mb-2">{s.icon}</p>
                <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Desglose por conductor</h3>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Conductor', 'Viajes', 'Ingresos brutos', 'Comisión Going', 'Neto conductor', 'Pendiente pago', 'Acción'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {MOCK_DRIVERS.filter(d => d.status !== 'pending').map(d => {
                  const commission = d.totalEarnings * d.commissionRate / 100;
                  const net = d.totalEarnings - commission;
                  return (
                    <tr key={d.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-gray-900">{d.firstName} {d.lastName}</td>
                      <td className="px-4 py-3 text-gray-600">{d.totalTrips}</td>
                      <td className="px-4 py-3 font-semibold">${d.totalEarnings.toFixed(2)}</td>
                      <td className="px-4 py-3 text-green-600 font-semibold">${commission.toFixed(2)}</td>
                      <td className="px-4 py-3 text-gray-700">${net.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold ${d.pendingPayout > 0 ? 'text-yellow-600' : 'text-gray-400'}`}>
                          ${d.pendingPayout.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {d.pendingPayout > 0 && (
                          <button className="px-3 py-1 text-xs font-bold text-white rounded-lg" style={{ backgroundColor: '#0033A0' }}>
                            Liquidar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB: CAPACITACIÓN ─── */}
      {tab === 'capacitacion' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Cursos disponibles', value: COURSES.length, color: '#0033A0' },
              { label: 'Conductores certificados', value: MOCK_DRIVERS.filter(d => d.coursesCompleted === d.totalCourses).length, color: '#16a34a' },
              { label: 'Con capacitación pendiente', value: MOCK_DRIVERS.filter(d => d.coursesCompleted < d.totalCourses).length, color: '#f59e0b' },
              { label: 'Promedio cursos completados', value: (MOCK_DRIVERS.reduce((s, d) => s + d.coursesCompleted, 0) / MOCK_DRIVERS.length).toFixed(1), color: '#8b5cf6' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Courses list */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Cursos de la plataforma</h3>
            <div className="space-y-3">
              {COURSES.map(c => {
                const pct = Math.round((c.completed / c.total) * 100);
                return (
                  <div key={c.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                    <div className="text-2xl">🎓</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{c.title}</p>
                      <p className="text-xs text-gray-400">{c.level} · {c.duration}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-gray-900">{c.completed}/{c.total} conductores</p>
                      <div className="w-32 h-1.5 bg-gray-200 rounded-full mt-1">
                        <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: pct === 100 ? '#16a34a' : '#0033A0' }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Per-driver progress */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Progreso por conductor</h3>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Conductor', 'Estado', 'Cursos completados', 'Progreso', 'Certificado'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {MOCK_DRIVERS.map(d => {
                  const pct = Math.round((d.coursesCompleted / d.totalCourses) * 100);
                  const s = STATUS_STYLES[d.status];
                  return (
                    <tr key={d.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-gray-900">{d.firstName} {d.lastName}</td>
                      <td className="px-4 py-3"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}>{s.label}</span></td>
                      <td className="px-4 py-3 text-gray-700">{d.coursesCompleted} de {d.totalCourses}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-gray-200 rounded-full">
                            <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: pct === 100 ? '#16a34a' : '#0033A0' }} />
                          </div>
                          <span className="text-xs text-gray-500">{pct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {d.coursesCompleted === d.totalCourses
                          ? <span className="text-green-600 font-bold text-sm">✓ Certificado</span>
                          : <span className="text-gray-400 text-xs">Pendiente</span>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </AdminLayout>
  );
}
