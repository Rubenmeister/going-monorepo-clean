'use client';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';
import { Button } from '@going-monorepo-clean/shared-ui';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

// Chart Component
function SimpleBarChart({ data, title }: any) {
  const maxValue = Math.max(...data.map((d: any) => d.value));

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="space-y-4">
        {data.map((item: any) => (
          <div key={item.label}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">{item.label}</span>
              <span className="text-sm font-semibold">{item.value}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LineChart({ data, title }: any) {
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="text-center text-gray-500">
        <p>📊 Gráfico de línea (implementar con recharts o similar)</p>
        <div className="mt-4 space-y-2">
          {data.map((d: any) => (
            <div key={d.date} className="text-sm">
              {d.date}: {d.value} bookings
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const { auth } = useMonorepoApp();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalBookings: 156,
    totalRevenue: 18450.50,
    activeUsers: 342,
    completedBookings: 128,
    conversionRate: 82.05,
    averageRating: 4.6,
  });

  const [bookingsByService, setBookingsByService] = useState([
    { label: 'Transport', value: 45 },
    { label: 'Accommodation', value: 38 },
    { label: 'Tours', value: 35 },
    { label: 'Experiences', value: 28 },
    { label: 'Parcels', value: 10 },
  ]);

  const [bookingTrend, setBookingTrend] = useState([
    { date: 'Lun', value: 12 },
    { date: 'Mar', value: 15 },
    { date: 'Mié', value: 18 },
    { date: 'Jue', value: 20 },
    { date: 'Vie', value: 25 },
    { date: 'Sáb', value: 22 },
    { date: 'Dom', value: 19 },
  ]);

  if (auth.isLoading) {
    return <div className="p-10 text-xl text-center">Cargando...</div>;
  }

  if (!auth.user?.isAdmin?.()) {
    return (
      <div className="p-10 text-center text-red-600">
        ACCESO DENEGADO - Se requiere rol de administrador
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="flex">
        <div className="flex-grow p-8">
          <h1 className="text-3xl font-bold mb-6 text-[#0033A0]">
            Analytics & Estadísticas
          </h1>

          {/* KPIs */}
          <div className="grid grid-cols-6 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-4">
              <h4 className="text-gray-600 text-sm mb-1">Total Reservas</h4>
              <p className="text-2xl font-bold text-[#0033A0]">{stats.totalBookings}</p>
              <p className="text-xs text-green-600 mt-1">+12% vs mes anterior</p>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <h4 className="text-gray-600 text-sm mb-1">Ingresos</h4>
              <p className="text-2xl font-bold text-green-600">${stats.totalRevenue.toFixed(2)}</p>
              <p className="text-xs text-green-600 mt-1">+8% vs mes anterior</p>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <h4 className="text-gray-600 text-sm mb-1">Usuarios Activos</h4>
              <p className="text-2xl font-bold text-blue-600">{stats.activeUsers}</p>
              <p className="text-xs text-green-600 mt-1">+15% vs mes anterior</p>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <h4 className="text-gray-600 text-sm mb-1">Completadas</h4>
              <p className="text-2xl font-bold text-purple-600">{stats.completedBookings}</p>
              <p className="text-xs text-green-600 mt-1">+5% vs mes anterior</p>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <h4 className="text-gray-600 text-sm mb-1">Conversión</h4>
              <p className="text-2xl font-bold text-orange-600">{stats.conversionRate}%</p>
              <p className="text-xs text-red-600 mt-1">-2% vs mes anterior</p>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <h4 className="text-gray-600 text-sm mb-1">Rating Promedio</h4>
              <p className="text-2xl font-bold text-yellow-600">⭐ {stats.averageRating}</p>
              <p className="text-xs text-green-600 mt-1">+0.2 vs mes anterior</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <SimpleBarChart
                title="Reservas por Tipo de Servicio"
                data={bookingsByService}
              />
            </div>

            <div>
              <LineChart
                title="Tendencia de Reservas (Última Semana)"
                data={bookingTrend}
              />
            </div>
          </div>

          {/* Detailed Stats */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Resumen Financiero</h3>
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-2">Métrica</th>
                  <th className="text-right py-2">Valor</th>
                  <th className="text-right py-2">Cambio</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2">Ingresos Totales</td>
                  <td className="text-right font-semibold">${stats.totalRevenue.toFixed(2)}</td>
                  <td className="text-right text-green-600">+8%</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Promedio por Reserva</td>
                  <td className="text-right font-semibold">${(stats.totalRevenue / stats.totalBookings).toFixed(2)}</td>
                  <td className="text-right text-green-600">+3%</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Ingresos Pendientes</td>
                  <td className="text-right font-semibold">${(stats.totalRevenue * 0.15).toFixed(2)}</td>
                  <td className="text-right text-yellow-600">±0%</td>
                </tr>
                <tr>
                  <td className="py-2 font-semibold">Ingresos Netos</td>
                  <td className="text-right font-semibold text-green-600">${(stats.totalRevenue * 0.85).toFixed(2)}</td>
                  <td className="text-right text-green-600">+8%</td>
                </tr>
              </tbody>
            </table>
          </div>

          <Button
            onClick={() => router.push('/')}
            variant="secondary"
            className="mt-8"
          >
            Volver al Dashboard
          </Button>
        </div>
      </div>
    </main>
  );
}
