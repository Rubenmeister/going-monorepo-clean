'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';
import { AdminLayout } from '../components';

interface Vehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  type: 'Sedán' | 'SUV' | 'Van' | 'Pickup' | 'Minibús';
  category: 'Confort' | 'Premium';
  color: string;
  capacity: number;
  status: 'active' | 'maintenance' | 'suspended' | 'pending';
  driverName: string;
  driverId: string;
  company: string;
  province: string;
  canton: string;
  parish: string;
  soatExpiry: string;
  techReviewExpiry: string;
  insuranceExpiry: string;
  totalKm: number;
  joinedAt: string;
}

const VEHICLES: Vehicle[] = [
  { id: 'v1', plate: 'PBJ-1234', brand: 'Toyota', model: 'RAV4', year: 2022, type: 'SUV', category: 'Premium', color: 'Blanco', capacity: 5, status: 'active', driverName: 'Carlos Moreira', driverId: 'd1', company: 'Independiente', province: 'Pichincha', canton: 'Quito', parish: 'Iñaquito', soatExpiry: '2026-08-15', techReviewExpiry: '2026-06-20', insuranceExpiry: '2026-12-31', totalKm: 42800, joinedAt: '2024-03-15' },
  { id: 'v2', plate: 'TBQ-5678', brand: 'Hyundai', model: 'Accent', year: 2021, type: 'Sedán', category: 'Confort', color: 'Gris', capacity: 4, status: 'active', driverName: 'María Tipán', driverId: 'd2', company: 'Independiente', province: 'Tungurahua', canton: 'Ambato', parish: 'La Matriz', soatExpiry: '2026-11-10', techReviewExpiry: '2027-01-15', insuranceExpiry: '2026-10-30', totalKm: 31200, joinedAt: '2024-06-01' },
  { id: 'v3', plate: 'GBR-9012', brand: 'Kia', model: 'Carnival', year: 2023, type: 'Van', category: 'Premium', color: 'Negro', capacity: 8, status: 'active', driverName: 'Jorge Salazar', driverId: 'd3', company: 'FlotaExpress S.A.', province: 'Guayas', canton: 'Guayaquil', parish: 'Kennedy', soatExpiry: '2026-09-20', techReviewExpiry: '2026-07-05', insuranceExpiry: '2027-01-15', totalKm: 65400, joinedAt: '2023-11-20' },
  { id: 'v4', plate: 'AZB-3456', brand: 'Chevrolet', model: 'Sail', year: 2020, type: 'Sedán', category: 'Confort', color: 'Azul', capacity: 4, status: 'maintenance', driverName: 'Ana Flores', driverId: 'd4', company: 'Independiente', province: 'Azuay', canton: 'Cuenca', parish: 'El Batán', soatExpiry: '2026-05-18', techReviewExpiry: '2025-12-10', insuranceExpiry: '2026-04-25', totalKm: 89700, joinedAt: '2025-01-10' },
  { id: 'v5', plate: 'COT-7890', brand: 'Nissan', model: 'X-Trail', year: 2021, type: 'SUV', category: 'Confort', color: 'Plata', capacity: 5, status: 'pending', driverName: 'Luis Cando', driverId: 'd5', company: 'Independiente', province: 'Cotopaxi', canton: 'Latacunga', parish: 'La Matriz', soatExpiry: '2027-03-10', techReviewExpiry: '2027-02-28', insuranceExpiry: '2027-03-10', totalKm: 12400, joinedAt: '2026-03-20' },
  { id: 'v6', plate: 'PCH-2345', brand: 'Mazda', model: '3', year: 2022, type: 'Sedán', category: 'Confort', color: 'Rojo', capacity: 4, status: 'active', driverName: 'Rosa Quishpe', driverId: 'd6', company: 'Independiente', province: 'Pichincha', canton: 'Quito', parish: 'Cotocollao', soatExpiry: '2026-10-05', techReviewExpiry: '2026-09-12', insuranceExpiry: '2026-11-20', totalKm: 28600, joinedAt: '2024-09-05' },
  { id: 'v7', plate: 'GBQ-4321', brand: 'Toyota', model: 'Hiace', year: 2019, type: 'Minibús', category: 'Confort', color: 'Blanco', capacity: 15, status: 'active', driverName: 'Pedro Vera', driverId: 'd7', company: 'FlotaExpress S.A.', province: 'Guayas', canton: 'Guayaquil', parish: 'Urdesa', soatExpiry: '2026-07-30', techReviewExpiry: '2026-06-15', insuranceExpiry: '2026-08-01', totalKm: 142000, joinedAt: '2023-05-12' },
  { id: 'v8', plate: 'IMB-6789', brand: 'Ford', model: 'Explorer', year: 2022, type: 'SUV', category: 'Premium', color: 'Negro', capacity: 6, status: 'active', driverName: 'Elena Pozo', driverId: 'd8', company: 'NorteTransport', province: 'Imbabura', canton: 'Ibarra', parish: 'El Sagrario', soatExpiry: '2026-12-15', techReviewExpiry: '2026-11-08', insuranceExpiry: '2027-01-10', totalKm: 19800, joinedAt: '2024-11-03' },
];

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  active:      { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Activo'       },
  maintenance: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Mantenimiento' },
  suspended:   { bg: 'bg-red-100',    text: 'text-red-700',    label: 'Suspendido'   },
  pending:     { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pendiente'    },
};

function isExpiringSoon(dateStr: string) {
  const diff = (new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return diff < 30;
}

export default function VehiclesPage() {
  const { auth } = useMonorepoApp();
  const router = useRouter();
  const [search, setSearch]         = useState('');
  const [filterProvince, setFilterProvince] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCompany, setFilterCompany] = useState('all');

  useEffect(() => {
    if (!auth.isLoading && !auth.user) router.push('/login');
  }, [auth.isLoading, auth.user, router]);

  const provinces = Array.from(new Set(VEHICLES.map(v => v.province))).sort();
  const types     = Array.from(new Set(VEHICLES.map(v => v.type))).sort();
  const companies = Array.from(new Set(VEHICLES.map(v => v.company))).sort();

  const filtered = VEHICLES.filter(v => {
    const q = search.toLowerCase();
    const matchQ = !q || `${v.plate} ${v.brand} ${v.model} ${v.driverName}`.toLowerCase().includes(q);
    return matchQ
      && (filterProvince === 'all' || v.province === filterProvince)
      && (filterType === 'all' || v.type === filterType)
      && (filterStatus === 'all' || v.status === filterStatus)
      && (filterCompany === 'all' || v.company === filterCompany);
  });

  const expiringSoon = VEHICLES.filter(v =>
    isExpiringSoon(v.soatExpiry) || isExpiringSoon(v.techReviewExpiry) || isExpiringSoon(v.insuranceExpiry)
  ).length;

  return (
    <AdminLayout userName={auth.user?.firstName ?? 'Admin'} onLogout={auth.logout}>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vehículos</h1>
          <p className="text-gray-500 text-sm mt-0.5">Flota registrada en la plataforma Going</p>
        </div>
        <button className="px-4 py-2 text-sm font-bold text-white rounded-xl" style={{ backgroundColor: '#ff4c41' }}>
          + Registrar vehículo
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Total',          value: VEHICLES.length,                                              color: '#0033A0' },
          { label: 'Activos',        value: VEHICLES.filter(v => v.status === 'active').length,           color: '#16a34a' },
          { label: 'Mantenimiento',  value: VEHICLES.filter(v => v.status === 'maintenance').length,      color: '#f97316' },
          { label: 'Pendientes',     value: VEHICLES.filter(v => v.status === 'pending').length,          color: '#f59e0b' },
          { label: '⚠️ Docs próximos a vencer', value: expiringSoon,                                       color: '#ef4444' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4 flex flex-wrap gap-3">
        <input type="text" placeholder="Buscar placa, conductor, marca…"
          value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[180px] px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300" />
        {[
          { label: 'Provincia',  value: filterProvince, setter: setFilterProvince, options: provinces },
          { label: 'Tipo',       value: filterType,     setter: setFilterType,     options: types },
          { label: 'Estado',     value: filterStatus,   setter: setFilterStatus,   options: ['active','maintenance','suspended','pending'] },
          { label: 'Empresa',    value: filterCompany,  setter: setFilterCompany,  options: companies },
        ].map(f => (
          <select key={f.label} value={f.value} onChange={e => f.setter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none">
            <option value="all">Todas las {f.label.toLowerCase()}s</option>
            {f.options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Placa','Vehículo','Conductor','Empresa','Ubicación','Tipo/Cat.','Estado','SOAT','Rev. Técnica','Seguro','Km'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(v => {
              const s = STATUS_STYLE[v.status];
              const soatWarn   = isExpiringSoon(v.soatExpiry);
              const techWarn   = isExpiringSoon(v.techReviewExpiry);
              const insurWarn  = isExpiringSoon(v.insuranceExpiry);
              return (
                <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-gray-900">{v.plate}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900">{v.brand} {v.model}</p>
                    <p className="text-xs text-gray-400">{v.year} · {v.color} · {v.capacity} pax</p>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{v.driverName}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{v.company}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    <p>{v.province}</p>
                    <p className="text-gray-400">{v.canton} · {v.parish}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs font-semibold text-gray-700">{v.type}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${v.category === 'Premium' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>
                      {v.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${s.bg} ${s.text}`}>{s.label}</span>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span className={soatWarn ? 'text-red-600 font-bold' : 'text-gray-600'}>
                      {soatWarn ? '⚠️ ' : ''}{new Date(v.soatExpiry).toLocaleDateString('es-EC')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span className={techWarn ? 'text-red-600 font-bold' : 'text-gray-600'}>
                      {techWarn ? '⚠️ ' : ''}{new Date(v.techReviewExpiry).toLocaleDateString('es-EC')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span className={insurWarn ? 'text-red-600 font-bold' : 'text-gray-600'}>
                      {insurWarn ? '⚠️ ' : ''}{new Date(v.insuranceExpiry).toLocaleDateString('es-EC')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">{v.totalKm.toLocaleString()} km</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="p-8 text-center text-gray-400">No se encontraron vehículos.</div>}
      </div>

    </AdminLayout>
  );
}
