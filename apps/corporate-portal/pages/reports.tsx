import Layout from '../components/Layout';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

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

const MONTHLY_DATA: MonthlyData[] = [
  {
    month: 'Sep 2025',
    total: 1200,
    transport: 500,
    accommodation: 400,
    tour: 200,
    experience: 100,
    bookings: 14,
  },
  {
    month: 'Oct 2025',
    total: 1800,
    transport: 700,
    accommodation: 600,
    tour: 300,
    experience: 200,
    bookings: 22,
  },
  {
    month: 'Nov 2025',
    total: 1500,
    transport: 600,
    accommodation: 500,
    tour: 250,
    experience: 150,
    bookings: 18,
  },
  {
    month: 'Dec 2025',
    total: 2100,
    transport: 800,
    accommodation: 700,
    tour: 400,
    experience: 200,
    bookings: 25,
  },
  {
    month: 'Jan 2026',
    total: 1650,
    transport: 650,
    accommodation: 550,
    tour: 300,
    experience: 150,
    bookings: 20,
  },
  {
    month: 'Feb 2026',
    total: 980,
    transport: 400,
    accommodation: 320,
    tour: 160,
    experience: 100,
    bookings: 12,
  },
];

const EMPLOYEE_SPEND: EmployeeSpend[] = [
  { name: 'Carlos Rodríguez', department: 'Sales', total: 840, bookings: 8 },
  { name: 'Ana Martínez', department: 'Engineering', total: 620, bookings: 5 },
  { name: 'Luis Pérez', department: 'Marketing', total: 530, bookings: 6 },
  { name: 'María Gómez', department: 'HR', total: 290, bookings: 3 },
];

const MAX_BAR = Math.max(...MONTHLY_DATA.map((d) => d.total));

export default function Reports() {
  const { status } = useSession();
  const router = useRouter();
  const [selectedMonth, setSelectedMonth] = useState('Feb 2026');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
  }, [status, router]);

  const current =
    MONTHLY_DATA.find((d) => d.month === selectedMonth) || MONTHLY_DATA.at(-1)!;
  const prev = MONTHLY_DATA[MONTHLY_DATA.indexOf(current) - 1];
  const diff = prev ? ((current.total - prev.total) / prev.total) * 100 : 0;

  const handleExportCSV = () => {
    const rows = [
      [
        'Month',
        'Total',
        'Transport',
        'Accommodation',
        'Tour',
        'Experience',
        'Bookings',
      ],
      ...MONTHLY_DATA.map((d) => [
        d.month,
        d.total,
        d.transport,
        d.accommodation,
        d.tour,
        d.experience,
        d.bookings,
      ]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `going-corporate-report-${selectedMonth.replace(
      ' ',
      '-'
    )}.csv`;
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
            <p className="text-gray-500 mt-1">
              Spending analytics and expense tracking
            </p>
          </div>
          <div className="flex gap-3">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              {MONTHLY_DATA.map((d) => (
                <option key={d.month} value={d.month}>
                  {d.month}
                </option>
              ))}
            </select>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-900 transition"
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow p-5">
            <p className="text-sm text-gray-500">Total Spent</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              ${current.total.toLocaleString()}
            </p>
            <p
              className={`text-xs mt-1 font-medium ${
                diff >= 0 ? 'text-red-500' : 'text-green-500'
              }`}
            >
              {diff >= 0 ? '▲' : '▼'} {Math.abs(diff).toFixed(1)}% vs last month
            </p>
          </div>
          <div className="bg-white rounded-xl shadow p-5">
            <p className="text-sm text-gray-500">Bookings</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {current.bookings}
            </p>
            <p className="text-xs text-gray-400 mt-1">trips this month</p>
          </div>
          <div className="bg-white rounded-xl shadow p-5">
            <p className="text-sm text-gray-500">Avg per trip</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              ${(current.total / current.bookings).toFixed(0)}
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
              {MONTHLY_DATA.map((d) => (
                <div key={d.month} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-16 shrink-0">
                    {d.month}
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                    <div
                      className="h-4 rounded-full bg-blue-500 transition-all"
                      style={{ width: `${(d.total / MAX_BAR) * 100}%` }}
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
            <h2 className="font-semibold text-gray-800 mb-5">
              Breakdown — {selectedMonth}
            </h2>
            <div className="space-y-4">
              {[
                {
                  label: 'Transport',
                  value: current.transport,
                  color: 'bg-blue-500',
                  icon: '🚗',
                },
                {
                  label: 'Accommodation',
                  value: current.accommodation,
                  color: 'bg-purple-500',
                  icon: '🏨',
                },
                {
                  label: 'Tour',
                  value: current.tour,
                  color: 'bg-green-500',
                  icon: '🗺️',
                },
                {
                  label: 'Experience',
                  value: current.experience,
                  color: 'bg-orange-500',
                  icon: '🎭',
                },
              ].map(({ label, value, color, icon }) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">
                      {icon} {label}
                    </span>
                    <span className="text-sm font-semibold text-gray-800">
                      ${value} ({((value / current.total) * 100).toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${color}`}
                      style={{ width: `${(value / current.total) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top spenders */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Top Spenders</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 text-gray-500 font-medium">Employee</th>
                  <th className="pb-2 text-gray-500 font-medium">Department</th>
                  <th className="pb-2 text-gray-500 font-medium">Bookings</th>
                  <th className="pb-2 text-gray-500 font-medium text-right">
                    Total Spent
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {EMPLOYEE_SPEND.map((e, i) => (
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
      </div>
    </Layout>
  );
}
