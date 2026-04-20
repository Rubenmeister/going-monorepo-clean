import Layout from '../components/Layout';
import { useSession } from '../lib/auth';
import { useRouter } from 'next/router';
import { useEffect, useState, useCallback } from 'react';
import { corpFetch } from '../lib/api';

interface MonthlyData {
  month: string;
  total: number;
  transport: number;
  accommodation: number;
  tour: number;
  experience: number;
  bookings: number;
}
interface EmployeeSpend {
  name: string;
  department: string;
  total: number;
  bookings: number;
}

const SERVICES = [
  { key: 'transport',     label: 'Transporte',   icon: '🚗', color: '#ff4c41' },
  { key: 'accommodation', label: 'Alojamiento',  icon: '🏨', color: '#d97706' },
  { key: 'tour',          label: 'Tours',        icon: '🗺️', color: '#059669' },
  { key: 'experience',    label: 'Experiencias', icon: '🎭', color: '#7c3aed' },
];

// Simple bar visual using div widths
function BarChart({ data, max }: { data: MonthlyData[]; max: number }) {
  if (data.length === 0) return null;
  return (
    <div className="space-y-2.5">
      {data.map(d => (
        <div key={d.month} className="flex items-center gap-3">
          <span className="text-xs text-gray-500 w-20 text-right flex-shrink-0">{d.month}</span>
          <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden relative">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: max > 0 ? `${(d.total / max) * 100}%` : '0%', backgroundColor: '#ff4c41' }}
            />
          </div>
          <span className="text-xs font-bold text-gray-700 w-20 flex-shrink-0">
            ${d.total.toLocaleString('es-ES', { minimumFractionDigits: 0 })}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function Reports() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [monthly, setMonthly] = useState([] as MonthlyData[]);
  const [topSpenders, setTopSpenders] = useState([] as EmployeeSpend[]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null as string | null);

  const token = (session as any)?.accessToken ?? '';

  const loadReports = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const data = await corpFetch<any>('/corporate/reports/summary', token);
      const rows: MonthlyData[] = (data.monthly ?? []).map((d: any) => ({
        month: d.month ?? d.period ?? '—',
        total: Number(d.total ?? d.totalAmount ?? 0),
        transport: Number(d.transport ?? 0),
        accommodation: Number(d.accommodation ?? 0),
        tour: Number(d.tour ?? 0),
        experience: Number(d.experience ?? 0),
        bookings: Number(d.bookings ?? d.bookingCount ?? 0),
      }));
      const spenders: EmployeeSpend[] = (data.topSpenders ?? []).map((e: any) => ({
        name: e.name ?? e.employeeName ?? '—',
        department: e.department ?? '—',
        total: Number(e.total ?? e.totalAmount ?? 0),
        bookings: Number(e.bookings ?? e.bookingCount ?? 0),
      }));
      setMonthly(rows);
      setTopSpenders(spenders);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
  }, [status, router]);
  useEffect(() => {
    if (status === 'authenticated') loadReports();
  }, [status, loadReports]);

  const totalSpend = monthly.reduce((s, m) => s + m.total, 0);
  const totalBookings = monthly.reduce((s, m) => s + m.bookings, 0);
  const maxMonth = Math.max(...monthly.map(m => m.total), 1);

  const serviceBreakdown = SERVICES.map(s => ({
    ...s,
    amount: monthly.reduce((sum, m) => sum + (m[s.key as keyof MonthlyData] as number || 0), 0),
  })).sort((a, b) => b.amount - a.amount);
  const maxService = Math.max(...serviceBreakdown.map(s => s.amount), 1);

  const exportCSV = () => {
    const rows = [
      ['Mes', 'Total (USD)', 'Transporte', 'Alojamiento', 'Tours', 'Experiencias', 'Reservas'],
      ...monthly.map(m => [m.month, m.total, m.transport, m.accommodation, m.tour, m.experience, m.bookings]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `going-empresas-reporte.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  if (status === 'loading') return null;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reportes de Gasto</h1>
            <p className="text-sm text-gray-500 mt-0.5">Análisis de consumo corporativo Going Empresas</p>
          </div>
          {!loading && monthly.length > 0 && (
            <button onClick={exportCSV}
              className="px-4 py-2 rounded-xl text-sm font-bold border border-gray-200 text-gray-700 hover:bg-gray-50 transition flex items-center gap-2">
              ⬇️ Exportar CSV
            </button>
          )}
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Gasto total acumulado',  value: loading ? '…' : `$${totalSpend.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`, icon: '💰', color: '#ff4c41' },
            { label: 'Reservas totales',        value: loading ? '…' : totalBookings,    icon: '📋', color: '#0ea5e9' },
            { label: 'Promedio por reserva',    value: loading ? '…' : totalBookings > 0 ? `$${(totalSpend / totalBookings).toFixed(2)}` : '—', icon: '📊', color: '#059669' },
            { label: 'Meses con actividad',     value: loading ? '…' : monthly.filter(m => m.total > 0).length, icon: '📅', color: '#7c3aed' },
          ].map(k => (
            <div key={k.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{k.icon}</span>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: k.color }} />
              </div>
              <p className="text-2xl font-black text-gray-900">{k.value}</p>
              <p className="text-xs text-gray-500 mt-1">{k.label}</p>
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">⚠️ {error}</div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-[#ff4c41] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Monthly chart */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-bold text-gray-900 mb-4">Gasto mensual</h2>
              {monthly.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">Sin datos de períodos anteriores</p>
              ) : (
                <BarChart data={monthly} max={maxMonth} />
              )}
            </div>

            {/* Service breakdown */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-bold text-gray-900 mb-4">Por servicio</h2>
              {serviceBreakdown.every(s => s.amount === 0) ? (
                <p className="text-gray-400 text-sm text-center py-8">Sin datos</p>
              ) : (
                <div className="space-y-4">
                  {serviceBreakdown.map(s => (
                    <div key={s.key}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{s.icon} {s.label}</span>
                        <span className="text-sm font-bold text-gray-900">${s.amount.toLocaleString()}</span>
                      </div>
                      <div className="bg-gray-100 rounded-full h-2.5">
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${(s.amount / maxService) * 100}%`, backgroundColor: s.color }} />
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {totalSpend > 0 ? ((s.amount / totalSpend) * 100).toFixed(1) : 0}% del gasto total
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top spenders */}
            <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="font-bold text-gray-900">Mayores consumidores</h2>
              </div>
              {topSpenders.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-10">Sin datos de empleados</p>
              ) : (
                <table className="w-full">
                  <thead style={{ backgroundColor: '#fafafa', borderBottom: '1px solid #f3f4f6' }}>
                    <tr>
                      {['Empleado', 'Departamento', 'Reservas', 'Gasto total'].map(h => (
                        <th key={h} className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {topSpenders.map((sp, i) => (
                      <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition">
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                              style={{ backgroundColor: '#ff4c41' }}>
                              {sp.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-semibold text-gray-800">{sp.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-600">{sp.department}</td>
                        <td className="px-6 py-3 text-sm text-gray-700">{sp.bookings}</td>
                        <td className="px-6 py-3 text-sm font-bold text-gray-900">
                          ${sp.total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
