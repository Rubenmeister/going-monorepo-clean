'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';
import { AdminLayout } from '../components';

interface Company {
  id: string;
  name: string;
  ruc: string;
  legalRep: string;
  phone: string;
  contactEmail: string;
  province: string;
  canton: string;
  address: string;
  sector: string;
  plan: 'Enterprise' | 'Business' | 'Starter';
  status: 'active' | 'suspended' | 'trial';
  employees: number;
  activeUsers: number;
  monthlyTrips: number;
  monthlyBilling: number;         // USD billed to company
  contractStart: string;
  contractEnd: string;
  paymentMethod: 'transferencia' | 'débito' | 'factura';
  notes: string;
}

const COMPANIES: Company[] = [
  {
    id: 'c1', name: 'Corporación Favorita C.A.', ruc: '1791836211001',
    legalRep: 'Patricio Álvarez', phone: '+593 2 298-0300',
    contactEmail: 'compras@favorita.com.ec',
    province: 'Pichincha', canton: 'Quito', address: 'Av. General Enríquez S/N, Sangolquí',
    sector: 'Retail / Supermercados',
    plan: 'Enterprise', status: 'active', employees: 420, activeUsers: 185,
    monthlyTrips: 1240, monthlyBilling: 9800,
    contractStart: '2025-01-01', contractEnd: '2026-12-31',
    paymentMethod: 'factura', notes: 'Cuenta clave. Renovación anual negociada.',
  },
  {
    id: 'c2', name: 'Grupo Difare S.A.', ruc: '0990072458001',
    legalRep: 'Marco Mayorga', phone: '+593 4 268-1400',
    contactEmail: 'logistica@difare.com.ec',
    province: 'Guayas', canton: 'Guayaquil', address: 'Km 4.5 Vía a Daule, Guayaquil',
    sector: 'Salud / Farmacias',
    plan: 'Enterprise', status: 'active', employees: 310, activeUsers: 140,
    monthlyTrips: 870, monthlyBilling: 6900,
    contractStart: '2025-03-01', contractEnd: '2026-02-28',
    paymentMethod: 'débito', notes: '',
  },
  {
    id: 'c3', name: 'Banco Pichincha C.A.', ruc: '1790010937001',
    legalRep: 'Hernán Freire', phone: '+593 2 298-0000',
    contactEmail: 'proveedores@pichincha.com',
    province: 'Pichincha', canton: 'Quito', address: 'Av. Amazonas 4545 y Pereira',
    sector: 'Finanzas / Banca',
    plan: 'Enterprise', status: 'active', employees: 280, activeUsers: 112,
    monthlyTrips: 690, monthlyBilling: 5500,
    contractStart: '2025-06-01', contractEnd: '2027-05-31',
    paymentMethod: 'transferencia', notes: 'Acuerdo marco corporativo 2 años.',
  },
  {
    id: 'c4', name: 'Ecuaquímica S.A.', ruc: '1790016919001',
    legalRep: 'Roberto Salinas', phone: '+593 2 299-6600',
    contactEmail: 'admin@ecuaquimica.com.ec',
    province: 'Pichincha', canton: 'Quito', address: 'Av. Eloy Alfaro N32-650',
    sector: 'Agroindustria / Química',
    plan: 'Business', status: 'active', employees: 95, activeUsers: 48,
    monthlyTrips: 320, monthlyBilling: 2400,
    contractStart: '2025-09-01', contractEnd: '2026-08-31',
    paymentMethod: 'factura', notes: '',
  },
  {
    id: 'c5', name: 'Constructora Andrade Gutiérrez', ruc: '0190138789001',
    legalRep: 'Andrés Gutiérrez', phone: '+593 7 282-1100',
    contactEmail: 'proyectos@ag-ec.com',
    province: 'Azuay', canton: 'Cuenca', address: 'Av. 12 de Abril y Unidad Nacional',
    sector: 'Construcción',
    plan: 'Business', status: 'active', employees: 68, activeUsers: 34,
    monthlyTrips: 210, monthlyBilling: 1680,
    contractStart: '2025-11-01', contractEnd: '2026-10-31',
    paymentMethod: 'transferencia', notes: 'Proyecto Cuenca 2026.',
  },
  {
    id: 'c6', name: 'TAME Línea Aérea del Ecuador', ruc: '1760003360001',
    legalRep: 'Carlos Villacís', phone: '+593 2 397-7100',
    contactEmail: 'logistica@tame.com.ec',
    province: 'Pichincha', canton: 'Quito', address: 'Av. Amazonas y Cordero, Quito',
    sector: 'Aviación / Transporte',
    plan: 'Business', status: 'trial', employees: 55, activeUsers: 20,
    monthlyTrips: 95, monthlyBilling: 760,
    contractStart: '2026-02-01', contractEnd: '2026-07-31',
    paymentMethod: 'factura', notes: 'Período de prueba 6 meses.',
  },
  {
    id: 'c7', name: 'Nestlé Ecuador S.A.', ruc: '1790011835001',
    legalRep: 'Isabela Romero', phone: '+593 2 398-6800',
    contactEmail: 'compras.ec@nestle.com',
    province: 'Pichincha', canton: 'Quito', address: 'Av. de los Shyris 3727 y Naciones Unidas',
    sector: 'Alimentos / FMCG',
    plan: 'Enterprise', status: 'active', employees: 200, activeUsers: 88,
    monthlyTrips: 540, monthlyBilling: 4300,
    contractStart: '2024-07-01', contractEnd: '2026-06-30',
    paymentMethod: 'débito', notes: '',
  },
  {
    id: 'c8', name: 'Claro Ecuador (CONECEL S.A.)', ruc: '0990805917001',
    legalRep: 'Diego Zambrano', phone: '+593 4 268-6000',
    contactEmail: 'b2b@claro.com.ec',
    province: 'Guayas', canton: 'Guayaquil', address: 'Av. Francisco de Orellana 234',
    sector: 'Telecomunicaciones',
    plan: 'Enterprise', status: 'active', employees: 350, activeUsers: 160,
    monthlyTrips: 980, monthlyBilling: 7800,
    contractStart: '2025-04-01', contractEnd: '2027-03-31',
    paymentMethod: 'factura', notes: 'VIP. Facturación mensual automatizada.',
  },
];

const PLAN_STYLES: Record<string, { bg: string; text: string }> = {
  Enterprise: { bg: 'bg-purple-100', text: 'text-purple-700' },
  Business:   { bg: 'bg-blue-100',   text: 'text-blue-700'   },
  Starter:    { bg: 'bg-gray-100',   text: 'text-gray-600'   },
};

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  active:    { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Activa'     },
  suspended: { bg: 'bg-red-100',    text: 'text-red-700',    label: 'Suspendida' },
  trial:     { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Trial'      },
};

const PAYMENT_LABELS: Record<string, string> = {
  transferencia: '🏦 Transferencia',
  débito:        '💳 Débito automático',
  factura:       '🧾 Factura crédito',
};

interface DetailModalProps { company: Company; onClose: () => void; }
function DetailModal({ company, onClose }: DetailModalProps) {
  const ps = PLAN_STYLES[company.plan];
  const ss = STATUS_STYLE[company.status];
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-100 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{company.name}</h2>
            <p className="text-xs text-gray-500 mt-0.5">RUC: {company.ruc} · {company.sector}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>
        <div className="p-6 space-y-4">
          {/* Status + Plan */}
          <div className="flex gap-2">
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${ps.bg} ${ps.text}`}>{company.plan}</span>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${ss.bg} ${ss.text}`}>{ss.label}</span>
          </div>
          {/* Contact */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-1 text-sm">
            <p><span className="text-gray-500">Rep. Legal:</span> <span className="font-semibold">{company.legalRep}</span></p>
            <p><span className="text-gray-500">Email:</span> {company.contactEmail}</p>
            <p><span className="text-gray-500">Teléfono:</span> {company.phone}</p>
            <p><span className="text-gray-500">Dirección:</span> {company.address}, {company.canton}, {company.province}</p>
          </div>
          {/* Metrics */}
          <div className="grid grid-cols-4 gap-3 text-center">
            {[
              { label: 'Empleados',    value: company.employees },
              { label: 'Usuarios act.', value: company.activeUsers },
              { label: 'Viajes/mes',   value: company.monthlyTrips },
              { label: 'Facturación',  value: `$${company.monthlyBilling.toLocaleString()}` },
            ].map(m => (
              <div key={m.label} className="bg-gray-50 rounded-xl p-3">
                <p className="text-lg font-black text-gray-900">{m.value}</p>
                <p className="text-xs text-gray-400">{m.label}</p>
              </div>
            ))}
          </div>
          {/* Contract */}
          <div className="bg-blue-50 rounded-xl p-4 text-sm space-y-1">
            <p className="font-semibold text-blue-900 mb-2">Contrato</p>
            <p><span className="text-blue-700">Inicio:</span> {new Date(company.contractStart).toLocaleDateString('es-EC')}</p>
            <p><span className="text-blue-700">Vencimiento:</span> {new Date(company.contractEnd).toLocaleDateString('es-EC')}</p>
            <p><span className="text-blue-700">Pago:</span> {PAYMENT_LABELS[company.paymentMethod]}</p>
          </div>
          {company.notes && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-800">
              📝 {company.notes}
            </div>
          )}
          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button className="flex-1 py-2 text-sm font-bold text-white rounded-xl" style={{ backgroundColor: '#0033A0' }}>
              ✉️ Contactar
            </button>
            <button className="flex-1 py-2 text-sm font-bold text-white rounded-xl" style={{ backgroundColor: company.status === 'active' ? '#ef4444' : '#16a34a' }}>
              {company.status === 'active' ? '⏸ Suspender' : '▶ Activar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CompaniesPage() {
  const { auth } = useMonorepoApp();
  const router = useRouter();
  const [search, setSearch]           = useState('');
  const [filterPlan, setFilterPlan]   = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterProvince, setFilterProvince] = useState('all');
  const [selected, setSelected]       = useState<Company | null>(null);

  useEffect(() => {
    if (!auth.isLoading && !auth.user) router.push('/login');
  }, [auth.isLoading, auth.user, router]);

  const provinces = Array.from(new Set(COMPANIES.map(c => c.province))).sort();

  const filtered = COMPANIES.filter(c => {
    const q = search.toLowerCase();
    const matchQ = !q || c.name.toLowerCase().includes(q) || c.ruc.includes(q)
      || c.canton.toLowerCase().includes(q) || c.sector.toLowerCase().includes(q);
    return matchQ
      && (filterPlan === 'all' || c.plan === filterPlan)
      && (filterStatus === 'all' || c.status === filterStatus)
      && (filterProvince === 'all' || c.province === filterProvince);
  });

  const totalBilling = filtered.reduce((s, c) => s + c.monthlyBilling, 0);
  const totalTrips   = filtered.reduce((s, c) => s + c.monthlyTrips, 0);
  const totalUsers   = filtered.reduce((s, c) => s + c.activeUsers, 0);

  return (
    <AdminLayout userName={auth.user?.firstName ?? 'Admin'} onLogout={auth.logout}>

      {selected && <DetailModal company={selected} onClose={() => setSelected(null)} />}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Empresas</h1>
          <p className="text-gray-500 text-sm mt-0.5">Clientes corporativos — Going Ecuador</p>
        </div>
        <button className="px-4 py-2 text-sm font-bold text-white rounded-xl" style={{ backgroundColor: '#ff4c41' }}>
          + Nueva empresa
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Total',          value: COMPANIES.length,                                              color: '#0033A0' },
          { label: 'Activas',        value: COMPANIES.filter(c => c.status === 'active').length,           color: '#16a34a' },
          { label: 'Trial',          value: COMPANIES.filter(c => c.status === 'trial').length,            color: '#f59e0b' },
          { label: 'Usuarios activos', value: totalUsers,                                                  color: '#8b5cf6' },
          { label: 'Facturación/mes', value: `$${totalBilling.toLocaleString()}`,                          color: '#ff4c41' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6 flex flex-wrap gap-3">
        <input type="text" placeholder="Buscar empresa, RUC, sector…" value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300" />
        <select value={filterPlan} onChange={e => setFilterPlan(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none">
          <option value="all">Todos los planes</option>
          <option value="Enterprise">Enterprise</option>
          <option value="Business">Business</option>
          <option value="Starter">Starter</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none">
          <option value="all">Todos los estados</option>
          <option value="active">Activas</option>
          <option value="trial">Trial</option>
          <option value="suspended">Suspendidas</option>
        </select>
        <select value={filterProvince} onChange={e => setFilterProvince(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none">
          <option value="all">Todas las provincias</option>
          {provinces.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto mb-6">
        <table className="w-full text-sm min-w-[900px]">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Empresa','RUC','Sector','Ubicación','Plan','Estado','Usuarios','Viajes/mes','Facturación','Contrato',''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(c => {
              const ps = PLAN_STYLES[c.plan];
              const ss = STATUS_STYLE[c.status];
              const contractDays = Math.round((new Date(c.contractEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              const contractWarn = contractDays < 60;
              return (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setSelected(c)}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900">{c.name}</p>
                    <p className="text-xs text-gray-400">{c.legalRep}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{c.ruc}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{c.sector}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    <p>{c.province}</p>
                    <p className="text-gray-400">{c.canton}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${ps.bg} ${ps.text}`}>{c.plan}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${ss.bg} ${ss.text}`}>{ss.label}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 text-center">{c.activeUsers}</td>
                  <td className="px-4 py-3 text-gray-700 text-center">{c.monthlyTrips}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">${c.monthlyBilling.toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs">
                    <span className={contractWarn ? 'text-red-600 font-bold' : 'text-gray-500'}>
                      {contractWarn ? '⚠️ ' : ''}{new Date(c.contractEnd).toLocaleDateString('es-EC')}
                    </span>
                  </td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <button className="px-3 py-1 text-xs font-bold text-white rounded-lg" style={{ backgroundColor: '#0033A0' }}
                      onClick={() => setSelected(c)}>
                      Ver
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="p-8 text-center text-gray-400">No se encontraron empresas.</div>}
      </div>

      {/* Summary footer */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-black text-blue-800">{totalTrips.toLocaleString()}</p>
            <p className="text-xs text-blue-600">Viajes corporativos / mes</p>
          </div>
          <div>
            <p className="text-2xl font-black text-blue-800">{totalUsers}</p>
            <p className="text-xs text-blue-600">Usuarios activos en empresas</p>
          </div>
          <div>
            <p className="text-2xl font-black text-blue-800">${totalBilling.toLocaleString()}</p>
            <p className="text-xs text-blue-600">Facturación B2B mensual</p>
          </div>
        </div>
      </div>

    </AdminLayout>
  );
}
