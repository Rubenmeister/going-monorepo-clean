'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';
import { AdminLayout } from '../components';

type HostType = 'tour' | 'experiencia' | 'alojamiento';
type HostTab = 'todos' | HostType;

interface Host {
  id: string;
  name: string;
  ownerName: string;
  type: HostType;
  email: string;
  phone: string;
  province: string;
  city: string;
  status: 'active' | 'suspended' | 'pending' | 'review';
  rating: number;
  totalBookings: number;
  bookingsThisMonth: number;
  totalRevenue: number;
  commissionRate: number;
  pendingPayout: number;
  servicesCount: number;
  joinedAt: string;
  description: string;
}

const HOSTS: Host[] = [
  { id: 'h1',  name: 'Casa Gangotena',          ownerName: 'Grupo Gangotena S.A.',   type: 'alojamiento', email: 'reservas@casagangotena.com',      phone: '+593 2 400 8000', province: 'Pichincha',   city: 'Quito',      status: 'active',    rating: 4.9, totalBookings: 620,  bookingsThisMonth: 44, totalRevenue: 18400.00, commissionRate: 10, pendingPayout: 1200.00, servicesCount: 3,  joinedAt: '2024-01-15', description: 'Hotel boutique de lujo en el Centro Histórico de Quito' },
  { id: 'h2',  name: 'Hotel Quito Royal',        ownerName: 'Inversiones Royal EC',   type: 'alojamiento', email: 'info@quitohotelroyal.com',         phone: '+593 2 223 4567', province: 'Pichincha',   city: 'Quito',      status: 'active',    rating: 4.6, totalBookings: 412,  bookingsThisMonth: 28, totalRevenue: 12800.00, commissionRate: 10, pendingPayout: 960.00,  servicesCount: 5,  joinedAt: '2024-03-20', description: 'Hotel 4 estrellas en la Zona Rosa de Quito' },
  { id: 'h3',  name: 'Hacienda El Prado',        ownerName: 'Familia Naranjo',         type: 'alojamiento', email: 'hacienda@elprado.ec',              phone: '+593 3 278 9010', province: 'Cotopaxi',    city: 'Latacunga',  status: 'active',    rating: 4.8, totalBookings: 184,  bookingsThisMonth: 12, totalRevenue: 7200.00,  commissionRate: 10, pendingPayout: 480.00,  servicesCount: 2,  joinedAt: '2024-05-10', description: 'Hacienda colonial a las faldas del Cotopaxi' },
  { id: 'h4',  name: 'Andes Discovery Tours',    ownerName: 'Diego Salazar',           type: 'tour',        email: 'tours@andesdiscovery.com',         phone: '+593 9 912 3456', province: 'Pichincha',   city: 'Quito',      status: 'active',    rating: 4.8, totalBookings: 510,  bookingsThisMonth: 38, totalRevenue: 9250.00,  commissionRate: 10, pendingPayout: 750.00,  servicesCount: 8,  joinedAt: '2023-11-05', description: 'Tours culturales y aventura en la Sierra ecuatoriana' },
  { id: 'h5',  name: 'Ecuador Jungle Trips',     ownerName: 'Kichwa Guide Co.',        type: 'tour',        email: 'amazon@jungletours.ec',            phone: '+593 9 823 4567', province: 'Orellana',    city: 'Tena',       status: 'active',    rating: 4.7, totalBookings: 298,  bookingsThisMonth: 22, totalRevenue: 6700.00,  commissionRate: 10, pendingPayout: 540.00,  servicesCount: 6,  joinedAt: '2024-02-18', description: 'Experiencias auténticas en la Amazonía ecuatoriana' },
  { id: 'h6',  name: 'Galápagos Pro Diving',     ownerName: 'Marina Galápagos S.A.',   type: 'tour',        email: 'dive@galapagospro.com',            phone: '+593 5 252 6789', province: 'Galápagos',   city: 'Santa Cruz', status: 'active',    rating: 4.9, totalBookings: 145,  bookingsThisMonth: 11, totalRevenue: 8900.00,  commissionRate: 10, pendingPayout: 680.00,  servicesCount: 4,  joinedAt: '2024-04-01', description: 'Buceo y snorkel en las Islas Galápagos' },
  { id: 'h7',  name: 'Kayak Baños Adventure',    ownerName: 'Carlos Aguirre',          type: 'experiencia', email: 'kayak@banosadventure.ec',          phone: '+593 9 734 5678', province: 'Tungurahua',  city: 'Baños',      status: 'active',    rating: 4.7, totalBookings: 340,  bookingsThisMonth: 29, totalRevenue: 4100.00,  commissionRate: 10, pendingPayout: 320.00,  servicesCount: 5,  joinedAt: '2024-01-20', description: 'Deportes extremos y aventura en el volcán Tungurahua' },
  { id: 'h8',  name: 'Surf School Montañita',    ownerName: 'Playa Dreams S.L.',       type: 'experiencia', email: 'surf@montanita.ec',                phone: '+593 9 645 6789', province: 'Santa Elena', city: 'Montañita',  status: 'active',    rating: 4.5, totalBookings: 215,  bookingsThisMonth: 18, totalRevenue: 2800.00,  commissionRate: 10, pendingPayout: 200.00,  servicesCount: 3,  joinedAt: '2024-06-15', description: 'Clases de surf en las mejores olas del Pacífico' },
  { id: 'h9',  name: 'Cotacachi Ceramic Arts',   ownerName: 'Artesanos Cotacachi',     type: 'experiencia', email: 'arte@cotacachi.ec',                phone: '+593 6 291 5678', province: 'Imbabura',    city: 'Cotacachi',  status: 'pending',   rating: 0,   totalBookings: 0,    bookingsThisMonth: 0,  totalRevenue: 0,        commissionRate: 10, pendingPayout: 0,       servicesCount: 1,  joinedAt: '2026-03-10', description: 'Talleres de cerámica y cuero con maestros artesanos' },
  { id: 'h10', name: 'Riobamba Trek & Camp',     ownerName: 'Chimborazo Expeditions',  type: 'tour',        email: 'info@chimborazotreks.ec',          phone: '+593 9 556 7890', province: 'Chimborazo',  city: 'Riobamba',   status: 'review',    rating: 4.2, totalBookings: 48,   bookingsThisMonth: 3,  totalRevenue: 1800.00,  commissionRate: 10, pendingPayout: 150.00,  servicesCount: 3,  joinedAt: '2025-08-20', description: 'Trekking al Chimborazo y Carihuairazo' },
];

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  active:    { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Activo'          },
  suspended: { bg: 'bg-red-100',    text: 'text-red-700',    label: 'Suspendido'      },
  pending:   { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pendiente'       },
  review:    { bg: 'bg-blue-100',   text: 'text-blue-700',   label: 'En revisión'     },
};

const TYPE_ICONS: Record<HostType, string> = {
  alojamiento: '🏨',
  tour:        '🗺️',
  experiencia: '🎭',
};

const TYPE_COLORS: Record<HostType, string> = {
  alojamiento: '#f59e0b',
  tour:        '#16a34a',
  experiencia: '#8b5cf6',
};

export default function HostsPage() {
  const { auth } = useMonorepoApp();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<HostTab>('todos');
  const [search, setSearch] = useState('');
  const [filterProvince, setFilterProvince] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedHost, setSelectedHost] = useState<Host | null>(null);

  useEffect(() => {
    if (!auth.isLoading && !auth.user) router.push('/login');
  }, [auth.isLoading, auth.user, router]);

  const provinces = Array.from(new Set(HOSTS.map(h => h.province))).sort();

  const filtered = HOSTS.filter(h => {
    const q = search.toLowerCase();
    const matchTab = activeTab === 'todos' || h.type === activeTab;
    const matchQ   = !q || `${h.name} ${h.ownerName} ${h.city}`.toLowerCase().includes(q);
    return matchTab && matchQ
      && (filterProvince === 'all' || h.province === filterProvince)
      && (filterStatus   === 'all' || h.status   === filterStatus);
  });

  const totalRevenue = HOSTS.reduce((s, h) => s + h.totalRevenue, 0);
  const totalPending = HOSTS.reduce((s, h) => s + h.pendingPayout, 0);

  const TABS: { key: HostTab; label: string; icon: string }[] = [
    { key: 'todos',        label: 'Todos',        icon: '📋' },
    { key: 'alojamiento',  label: 'Alojamientos', icon: '🏨' },
    { key: 'tour',         label: 'Tours',        icon: '🗺️' },
    { key: 'experiencia',  label: 'Experiencias', icon: '🎭' },
  ];

  return (
    <AdminLayout userName={auth.user?.firstName ?? 'Admin'} onLogout={auth.logout}>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Anfitriones y Proveedores</h1>
          <p className="text-gray-500 text-sm mt-0.5">Tours · Experiencias · Alojamientos</p>
        </div>
        <button className="px-4 py-2 text-sm font-bold text-white rounded-xl" style={{ backgroundColor: '#ff4c41' }}>
          + Agregar proveedor
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Total proveedores', value: HOSTS.length,                                          color: '#0033A0' },
          { label: 'Alojamientos',      value: HOSTS.filter(h => h.type === 'alojamiento').length,    color: '#f59e0b' },
          { label: 'Tours',             value: HOSTS.filter(h => h.type === 'tour').length,           color: '#16a34a' },
          { label: 'Experiencias',      value: HOSTS.filter(h => h.type === 'experiencia').length,    color: '#8b5cf6' },
          { label: 'Facturación total', value: `$${totalRevenue.toLocaleString('es-EC', { minimumFractionDigits: 0 })}`, color: '#ff4c41' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="text-xl font-black mt-1" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5 w-fit">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4 flex flex-wrap gap-3">
        <input type="text" placeholder="Buscar nombre, propietario, ciudad…"
          value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300" />
        <select value={filterProvince} onChange={e => setFilterProvince(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none">
          <option value="all">Todas las provincias</option>
          {provinces.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none">
          <option value="all">Todos los estados</option>
          <option value="active">Activo</option>
          <option value="pending">Pendiente</option>
          <option value="review">En revisión</option>
          <option value="suspended">Suspendido</option>
        </select>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map(h => {
          const s = STATUS_STYLE[h.status];
          const commission = h.totalRevenue * h.commissionRate / 100;
          return (
            <div key={h.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedHost(h)}
            >
              {/* Color bar */}
              <div className="h-1.5 w-full" style={{ backgroundColor: TYPE_COLORS[h.type] }} />
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                      style={{ backgroundColor: TYPE_COLORS[h.type] + '20' }}>
                      {TYPE_ICONS[h.type]}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{h.name}</p>
                      <p className="text-xs text-gray-400">{h.ownerName}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${s.bg} ${s.text}`}>{s.label}</span>
                </div>

                <p className="text-xs text-gray-500 mb-3 line-clamp-1">{h.description}</p>

                <div className="flex items-center gap-2 mb-3 text-xs text-gray-500">
                  <span>📍 {h.city}, {h.province}</span>
                  {h.rating > 0 && <span className="ml-auto font-bold text-yellow-600">⭐ {h.rating}</span>}
                </div>

                <div className="grid grid-cols-3 gap-2 text-center mb-3">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-sm font-bold text-gray-900">{h.servicesCount}</p>
                    <p className="text-xs text-gray-400">Servicios</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-sm font-bold text-gray-900">{h.totalBookings}</p>
                    <p className="text-xs text-gray-400">Reservas</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-sm font-bold" style={{ color: TYPE_COLORS[h.type] }}>
                      ${(h.totalRevenue / 1000).toFixed(1)}k
                    </p>
                    <p className="text-xs text-gray-400">Ingresos</p>
                  </div>
                </div>

                {h.pendingPayout > 0 && (
                  <div className="flex items-center justify-between bg-yellow-50 rounded-lg px-3 py-2 mt-2">
                    <span className="text-xs text-yellow-700 font-medium">⏳ Pendiente</span>
                    <span className="text-xs font-bold text-yellow-700">${h.pendingPayout.toFixed(0)}</span>
                  </div>
                )}

                <div className="flex gap-2 mt-3">
                  <button className="flex-1 text-xs py-1.5 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 font-medium"
                    onClick={e => { e.stopPropagation(); setSelectedHost(h); }}>
                    Ver detalle
                  </button>
                  {(h.status === 'pending' || h.status === 'review') && (
                    <button className="flex-1 text-xs py-1.5 text-white rounded-lg font-medium"
                      style={{ backgroundColor: '#16a34a' }}
                      onClick={e => e.stopPropagation()}>
                      Aprobar
                    </button>
                  )}
                  {h.status === 'active' && (
                    <button className="flex-1 text-xs py-1.5 text-white rounded-lg font-medium"
                      style={{ backgroundColor: '#0033A0' }}
                      onClick={e => e.stopPropagation()}>
                      Gestionar
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-3 text-center py-12 text-gray-400">No se encontraron proveedores.</div>
        )}
      </div>

      {/* Detail modal */}
      {selectedHost && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{TYPE_ICONS[selectedHost.type]}</span>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{selectedHost.name}</h2>
                  <p className="text-sm text-gray-400">{selectedHost.ownerName}</p>
                </div>
              </div>
              <button onClick={() => setSelectedHost(null)} className="text-gray-400 hover:text-gray-700 text-2xl">×</button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              {[
                ['Tipo', TYPE_ICONS[selectedHost.type] + ' ' + selectedHost.type.charAt(0).toUpperCase() + selectedHost.type.slice(1)],
                ['Estado', STATUS_STYLE[selectedHost.status].label],
                ['Email', selectedHost.email],
                ['Teléfono', selectedHost.phone],
                ['Ciudad', selectedHost.city],
                ['Provincia', selectedHost.province],
                ['Servicios activos', selectedHost.servicesCount.toString()],
                ['Reservas totales', selectedHost.totalBookings.toString()],
                ['Reservas este mes', selectedHost.bookingsThisMonth.toString()],
                ['Calificación', selectedHost.rating > 0 ? `⭐ ${selectedHost.rating}` : 'Sin calificaciones'],
                ['Facturación total', `$${selectedHost.totalRevenue.toFixed(2)}`],
                ['Comisión Going (10%)', `$${(selectedHost.totalRevenue * 0.1).toFixed(2)}`],
                ['Neto proveedor', `$${(selectedHost.totalRevenue * 0.9).toFixed(2)}`],
                ['Pendiente de pago', `$${selectedHost.pendingPayout.toFixed(2)}`],
                ['Desde', new Date(selectedHost.joinedAt).toLocaleDateString('es-EC')],
                ['Descripción', selectedHost.description],
              ].map(([k, v]) => (
                <div key={k} className={k === 'Descripción' ? 'col-span-2' : ''}>
                  <p className="text-xs text-gray-400 mb-0.5">{k}</p>
                  <p className="text-sm font-semibold text-gray-900">{v}</p>
                </div>
              ))}
            </div>
            <div className="p-6 pt-0 flex gap-3">
              {selectedHost.pendingPayout > 0 && (
                <button className="flex-1 py-2 text-sm font-bold text-white rounded-xl" style={{ backgroundColor: '#16a34a' }}>
                  Liquidar ${selectedHost.pendingPayout.toFixed(0)}
                </button>
              )}
              {selectedHost.status === 'active' && (
                <button className="flex-1 py-2 text-sm font-bold bg-red-50 text-red-600 rounded-xl hover:bg-red-100">
                  Suspender
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </AdminLayout>
  );
}
