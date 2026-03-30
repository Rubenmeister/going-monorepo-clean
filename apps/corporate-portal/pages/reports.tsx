import Layout from '../components/Layout';
import { useSession } from 'next-auth/react';
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

interface ReportsPayload {
  monthly?: MonthlyData[];
  topSpenders?: EmployeeSpend[];
}

export default function Reports() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [monthly, setMonthly] = useState<MonthlyData[]>([]);
  const [topSpenders, setTopSpenders] = useState<EmployeeSpend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState('');

  const token = (session as any)?.accessToken ?? '';

  const loadReports = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const data = await corpFetch<ReportsPayload>('/corporate/reports/summary', token);

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
      if (rows.length > 0) setSelectedMonth(rows[rows.length - 1].month);
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

  const current = monthly.find((d) => d.month === selectedMonth) ?? monthly[monthly.length - 1];
  const prevIdx = current ? monthly.indexOf(current) - 1 : -1;
  const prev = prevIdx >= 0 ? monthly[prevIdx] : null;
  const diff = prev && current ? ((current.total - prev.total) / prev.total) * 100 : 0;
  const maxBar = Math.max(...monthly.map((d) => d.total), 1);

  const handleExportCSV = () => {
    const rows = [
      ['Month', 'Total', 'Transport', 'Accommodation', 'Tour', 'Experience', 'Bookings'],
      ...monthly.map((d) => [d.month, d.total, d.transport, d.accommodation, d.tour, d.experience, d.bookings]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `going-corporate-report-${(selectedMonth || 'all').replace(' ', '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (status === 'loading') return null;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
            <p className="text-gray-500 mt-1">Spending analytics and expense tracking</p>
          </div>
          <div className="flex gap-3">
            {monthly.length > 0 && (
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm"
              >
                {monthly.map((d) => (
                  <option key={d.month} value={d.month}>
                    {d.month}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={handleExportCSV}
              disabled={monthly.length === 0}
              className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-900 transition disabled:opacity-50"
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 flex items-center gap-3">
            <span>⚠️ {error}</span>
            <button onClick={loadReports} className="ml-auto text-xs underline">
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-xl shadow p-16 text-center text-gray-400 text-sm animate-pulse">
            Loading report data…
          </div>
        ) : !current ? (
          <div className="bg-white rounded-xl shadow p-16 text-center text-gray-400">
            <p className="text-4xl mb-3">📊</p>
            <p className="font-medium">No report data available yet.</p>
          </div>
        ) : (
          <>
            {/* KPI row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-xl shadow p-5">
                <p className="text-sm text-gray-500">Total Spent</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  ${current.total.toLocaleString()}
                </p>
                {prev && (
                  <p className={`text-xs mt-1 font-medium ${diff >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {diff >= 0 ? '▲' : '▼'} {Math.abs(diff).toFixed(1)}% vs last month
                  </p>
                )}
              </div>
              <div className="bg-white rounded-xl shadow p-5">
                <p className="text-sm text-gray-500">Bookings</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{current.bookings}</p>
                <p className="text-xs text-gray-400 mt-1">trips this month</p>
              </div>
              <div className="bg-white rounded-xl shadow p-5">
                <p className="text-sm text-gray-500">Avg per trip</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  ${current.bookings > 0 ? (current.total / current.bookings).toFixed(0) : '—'}
                </p>
                <p className="text-xs text-gray-400 mt-1">cost per booking</p>
              </div>
              <div className="bg-white rounded-xl shadow p-5">
                <p className="text-sm text-gray-500">Top category</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">🚗</p>
                <p className="text-xs text-gray-400 mt-1">Transport</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Spend by month bar chart */}
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="font-semibold text-gray-800 mb-5">Monthly Spend</h2>
                <div className="space-y-3">
                  {monthly.map((d) => (
                    <div key={d.month} className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 w-16 shrink-0">{d.month}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                        <div
                          className="h-4 rounded-full bg-blue-500 transition-all"
                          style={{ width: `${(d.total / maxBar) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-gray-700 w-16 text-right">
                        ${d.total.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Breakdown by category */}
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="font-semibold text-gray-800 mb-5">Breakdown — {selectedMonth}</h2>
                <div className="space-y-4">
                  {[
                    { label: 'Transport', value: current.transport, color: 'bg-blue-500', icon: '🚗' },
                    { label: 'Accommodation', value: current.accommodation, color: 'bg-purple-500', icon: '🏨' },
                    { label: 'Tour', value: current.tour, color: 'bg-green-500', icon: '🗺️' },
                    { label: 'Experience', value: current.experience, color: 'bg-orange-500', icon: '🎭' },
                  ].map(({ label, value, color, icon }) => (
                    <div key={label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600">
                          {icon} {label}
                        </span>
                        <span className="text-sm font-semibold text-gray-800">
                          ${value} ({current.total > 0 ? ((value / current.total) * 100).toFixed(0) : 0}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${color}`}
                          style={{ width: `${current.total > 0 ? (value / current.total) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top spenders */}
            {topSpenders.length > 0 && (
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="font-semibold text-gray-800 mb-4">Top Spenders</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-2 text-gray-500 font-medium">Employee</th>
                        <th className="pb-2 text-gray-500 font-medium">Department</th>
                        <th className="pb-2 text-gray-500 font-medium">Bookings</th>
                        <th className="pb-2 text-gray-500 font-medium text-right">Total Spent</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {topSpenders.map((e, i) => (
                        <tr key={i}>
                          <td className="py-3 font-medium text-gray-800">{e.name}</td>
                          <td className="py-3 text-gray-500">{e.department}</td>
                          <td className="py-3 text-gray-700">{e.bookings}</td>
                          <td className="py-3 text-right font-semibold text-gray-900">
                            ${e.total.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
