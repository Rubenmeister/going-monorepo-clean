'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';
import { AdminLayout } from '../components';

type Period = 'day' | 'week' | 'month' | 'custom';

interface ProviderIncome {
  id: string;
  name: string;
  type: 'conductor' | 'tour' | 'experiencia' | 'alojamiento';
  totalRevenue: number;
  goingCommission: number;
  netPayout: number;
  transactions: number;
  pending: number;
  lastPayment: string;
}

const PROVIDERS: ProviderIncome[] = [
  { id: 'p1',  name: 'Carlos Moreira',        type: 'conductor',   totalRevenue: 4820.50, goingCommission: 723.08,  netPayout: 4097.42, transactions: 342, pending: 380.00,  lastPayment: '2026-03-15' },
  { id: 'p2',  name: 'María Tipán',            type: 'conductor',   totalRevenue: 3210.00, goingCommission: 481.50,  netPayout: 2728.50, transactions: 218, pending: 245.00,  lastPayment: '2026-03-10' },
  { id: 'p3',  name: 'Jorge Salazar',          type: 'conductor',   totalRevenue: 7340.00, goingCommission: 1101.00, netPayout: 6239.00, transactions: 510, pending: 520.00,  lastPayment: '2026-03-20' },
  { id: 'p4',  name: 'Rosa Quishpe',           type: 'conductor',   totalRevenue: 2890.00, goingCommission: 433.50,  netPayout: 2456.50, transactions: 195, pending: 310.00,  lastPayment: '2026-03-18' },
  { id: 'p5',  name: 'Casa Gangotena',         type: 'alojamiento', totalRevenue: 18400.00,goingCommission: 1840.00, netPayout: 16560.00,transactions: 62,  pending: 1200.00, lastPayment: '2026-03-01' },
  { id: 'p6',  name: 'Andes Discovery Tours',  type: 'tour',        totalRevenue: 9250.00, goingCommission: 925.00,  netPayout: 8325.00, transactions: 88,  pending: 750.00,  lastPayment: '2026-03-12' },
  { id: 'p7',  name: 'Kayak Baños Adventure',  type: 'experiencia', totalRevenue: 4100.00, goingCommission: 410.00,  netPayout: 3690.00, transactions: 55,  pending: 320.00,  lastPayment: '2026-03-08' },
  { id: 'p8',  name: 'Hotel Quito Royal',      type: 'alojamiento', totalRevenue: 12800.00,goingCommission: 1280.00, netPayout: 11520.00,transactions: 44,  pending: 960.00,  lastPayment: '2026-02-28' },
  { id: 'p9',  name: 'Ecuador Jungle Trips',   type: 'tour',        totalRevenue: 6700.00, goingCommission: 670.00,  netPayout: 6030.00, transactions: 73,  pending: 540.00,  lastPayment: '2026-03-05' },
  { id: 'p10', name: 'Surf School Montañita',  type: 'experiencia', totalRevenue: 2800.00, goingCommission: 280.00,  netPayout: 2520.00, transactions: 38,  pending: 200.00,  lastPayment: '2026-03-17' },
];

// Simulated daily data for chart
const DAILY_DATA = [
  { day: 'Lun', amount: 3240 }, { day: 'Mar', amount: 2890 }, { day: 'Mié', amount: 4120 },
  { day: 'Jue', amount: 3750 }, { day: 'Vie', amount: 5210 }, { day: 'Sáb', amount: 6480 },
  { day: 'Dom', amount: 4890 },
];

const MONTHLY_DATA = [
  { month: 'Oct', amount: 38200 }, { month: 'Nov', amount: 42100 }, { month: 'Dic', amount: 58900 },
  { month: 'Ene', amount: 35400 }, { month: 'Feb', amount: 41200 }, { month: 'Mar', amount: 47800 },
];

const TYPE_COLORS: Record<string, string> = {
  conductor:   '#0033A0',
  tour:        '#16a34a',
  experiencia: '#8b5cf6',
  alojamiento: '#f59e0b',
};

const TYPE_LABELS: Record<string, string> = {
  conductor:   'Conductor',
  tour:        'Tour',
  experiencia: 'Experiencia',
  alojamiento: 'Alojamiento',
};

export default function IngresosPage() {
  const { auth } = useMonorepoApp();
  const router = useRouter();
  const [period, setPeriod] = useState<Period>('month');
  const [filterType, setFilterType] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!auth.isLoading && !auth.user) router.push('/login');
  }, [auth.isLoading, auth.user, router]);

  const filtered = PROVIDERS.filter(p => {
    const q = search.toLowerCase();
    return (!q || p.name.toLowerCase().includes(q))
      && (filterType === 'all' || p.type === filterType);
  });

  const totalRevenue    = filtered.reduce((s, p) => s + p.totalRevenue, 0);
  const totalCommission = filtered.reduce((s, p) => s + p.goingCommission, 0);
  const totalPayout     = filtered.reduce((s, p) => s + p.netPayout, 0);
  const totalPending    = filtered.reduce((s, p) => s + p.pending, 0);

  const chartData = period === 'month' ? MONTHLY_DATA : DAILY_DATA;
  const maxBar    = Math.max(...chartData.map(d => d.amount));

  const PERIOD_LABELS: Record<Period, string> = {
    day: 'Hoy', week: 'Esta semana', month: 'Este mes', custom: 'Personalizado',
  };

  return (
    <AdminLayout userName={auth.user?.firstName ?? 'Admin'} onLogout={auth.logout}>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ingresos</h1>
          <p className="text-gray-500 text-sm mt-0.5">Facturación y pagos a proveedores — Going Ecuador</p>
        </div>
        <button className="px-4 py-2 text-sm font-bold text-white rounded-xl" style={{ backgroundColor: '#0033A0' }}>
          ↓ Exportar reporte
        </button>
      </div>

      {/* Period selector */}
      <div className="flex gap-2 mb-6">
        {(['day','week','month','custom'] as Period[]).map(p => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              period === p ? 'text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
            }`}
            style={period === p ? { backgroundColor: '#ff4c41' } : undefined}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Facturación total',     value: `$${totalRevenue.toLocaleString('es-EC', { minimumFractionDigits: 2 })}`,    icon: '💵', color: '#0033A0' },
          { label: 'Comisión Going',        value: `$${totalCommission.toLocaleString('es-EC', { minimumFractionDigits: 2 })}`,  icon: '📊', color: '#16a34a' },
          { label: 'Pagado a proveedores',  value: `$${totalPayout.toLocaleString('es-EC', { minimumFractionDigits: 2 })}`,     icon: '✅', color: '#6b7280' },
          { label: 'Pendiente de liquidar', value: `$${totalPending.toLocaleString('es-EC', { minimumFractionDigits: 2 })}`,    icon: '⏳', color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-2xl mb-1">{s.icon}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="text-xl font-black mt-0.5" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">
          {period === 'month' ? 'Ingresos mensuales (últimos 6 meses)' : 'Ingresos por día (última semana)'}
        </h3>
        <div className="flex items-end gap-3 h-32">
          {chartData.map(d => (
            <div key={d.day ?? d.month} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs font-medium text-gray-500">${(d.amount / 1000).toFixed(1)}k</span>
              <div className="w-full rounded-t-lg transition-all" style={{
                height: `${Math.round((d.amount / maxBar) * 96)}px`,
                backgroundColor: '#ff4c41',
                opacity: 0.8,
              }} />
              <span className="text-xs text-gray-400">{(d as any).day ?? (d as any).month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Type breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {(['conductor','tour','experiencia','alojamiento'] as const).map(type => {
          const group = PROVIDERS.filter(p => p.type === type);
          const rev   = group.reduce((s, p) => s + p.totalRevenue, 0);
          return (
            <div key={type} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold mb-2"
                style={{ backgroundColor: TYPE_COLORS[type] }}>
                {type === 'conductor' ? '🚗' : type === 'tour' ? '🗺️' : type === 'experiencia' ? '🎭' : '🏨'}
              </div>
              <p className="text-xs text-gray-500">{TYPE_LABELS[type]}s</p>
              <p className="text-lg font-black mt-0.5" style={{ color: TYPE_COLORS[type] }}>
                ${rev.toLocaleString('es-EC', { minimumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-gray-400">{group.length} proveedores</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4 flex flex-wrap gap-3">
        <input type="text" placeholder="Buscar proveedor…" value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300" />
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none">
          <option value="all">Todos los tipos</option>
          <option value="conductor">Conductores</option>
          <option value="tour">Tours</option>
          <option value="experiencia">Experiencias</option>
          <option value="alojamiento">Alojamientos</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Proveedor','Tipo','Transacciones','Facturación total','Comisión Going','Neto proveedor','Pendiente','Último pago','Acción'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-semibold text-gray-900">{p.name}</td>
                <td className="px-4 py-3">
                  <span className="text-xs font-semibold px-2 py-1 rounded-full text-white"
                    style={{ backgroundColor: TYPE_COLORS[p.type] }}>
                    {TYPE_LABELS[p.type]}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-700">{p.transactions}</td>
                <td className="px-4 py-3 font-semibold text-gray-900">${p.totalRevenue.toFixed(2)}</td>
                <td className="px-4 py-3 text-green-600 font-semibold">${p.goingCommission.toFixed(2)}</td>
                <td className="px-4 py-3 text-gray-700">${p.netPayout.toFixed(2)}</td>
                <td className="px-4 py-3">
                  <span className={`font-semibold ${p.pending > 0 ? 'text-yellow-600' : 'text-gray-400'}`}>
                    ${p.pending.toFixed(2)}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {new Date(p.lastPayment).toLocaleDateString('es-EC')}
                </td>
                <td className="px-4 py-3">
                  {p.pending > 0 && (
                    <button className="px-3 py-1 text-xs font-bold text-white rounded-lg" style={{ backgroundColor: '#16a34a' }}>
                      Liquidar ${p.pending.toFixed(0)}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="p-8 text-center text-gray-400">No se encontraron proveedores.</div>}
      </div>

    </AdminLayout>
  );
}
