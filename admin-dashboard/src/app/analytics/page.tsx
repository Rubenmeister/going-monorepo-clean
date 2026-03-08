'use client';
export const dynamic = 'force-dynamic';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';
import { Button } from '@going-monorepo-clean/shared-ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AdminLayout, StatCard } from '../components';
import { Loading, ErrorState } from '@going-monorepo-clean/shared-ui';

// ── MOCK DATA (replace with real API calls) ───────────────────────────
const STATS = {
  totalBookings: 156,
  totalRevenue: 18450.5,
  activeUsers: 342,
  completedBookings: 128,
  conversionRate: 82.05,
  averageRating: 4.6,
};

const BOOKINGS_BY_SERVICE = [
  { label: 'Transporte', value: 45, color: '#ff4c41' },
  { label: 'Alojamiento', value: 38, color: '#0ea5e9' },
  { label: 'Tours', value: 35, color: '#22C55E' },
  { label: 'Experiencias', value: 28, color: '#8B5CF6' },
  { label: 'Envíos', value: 10, color: '#F59E0B' },
];

const WEEKLY_TREND = [
  { day: 'Lun', value: 12 },
  { day: 'Mar', value: 15 },
  { day: 'Mié', value: 18 },
  { day: 'Jue', value: 20 },
  { day: 'Vie', value: 25 },
  { day: 'Sáb', value: 22 },
  { day: 'Dom', value: 19 },
];

const FINANCIAL_ROWS = [
  {
    label: 'Ingresos Totales',
    value: `$${STATS.totalRevenue.toFixed(2)}`,
    change: '+8%',
    up: true,
  },
  {
    label: 'Promedio por Reserva',
    value: `$${(STATS.totalRevenue / STATS.totalBookings).toFixed(2)}`,
    change: '+3%',
    up: true,
  },
  {
    label: 'Ingresos Pendientes',
    value: `$${(STATS.totalRevenue * 0.15).toFixed(2)}`,
    change: '±0%',
    up: null,
  },
  {
    label: 'Ingresos Netos',
    value: `$${(STATS.totalRevenue * 0.85).toFixed(2)}`,
    change: '+8%',
    up: true,
  },
];
// ── END DATA ──────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { auth } = useMonorepoApp();
  const router = useRouter();

  const maxBar = Math.max(...WEEKLY_TREND.map((d) => d.value));
  const maxService = Math.max(...BOOKINGS_BY_SERVICE.map((d) => d.value));

  if (auth.isLoading) {
    return <Loading fullHeight size="lg" message="Verificando sesión..." />;
  }

  if (!auth.user?.isAdmin?.()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <ErrorState
          title="Acceso Denegado"
          description="Se requiere rol de administrador para acceder a esta sección"
          action={<Button onClick={() => router.push('/')}>Volver</Button>}
        />
      </div>
    );
  }

  return (
    <AdminLayout userName={auth.user.firstName} onLogout={auth.logout}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">
          Analítica y Estadísticas
        </h1>
        <p className="text-gray-500">
          Métricas de la plataforma en tiempo real
        </p>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <StatCard
          icon="📊"
          title="Total Reservas"
          value={STATS.totalBookings}
          subtitle="+12% vs mes anterior"
          color="primary"
        />
        <StatCard
          icon="💰"
          title="Ingresos"
          value={`$${STATS.totalRevenue.toLocaleString()}`}
          subtitle="+8% vs mes anterior"
          color="success"
        />
        <StatCard
          icon="👥"
          title="Usuarios Activos"
          value={STATS.activeUsers}
          subtitle="+15% vs mes anterior"
          color="info"
        />
        <StatCard
          icon="✅"
          title="Completadas"
          value={STATS.completedBookings}
          subtitle="+5% vs mes anterior"
          color="success"
        />
        <StatCard
          icon="🎯"
          title="Conversión"
          value={`${STATS.conversionRate}%`}
          subtitle="-2% vs mes anterior"
          color="warning"
        />
        <StatCard
          icon="⭐"
          title="Rating Promedio"
          value={STATS.averageRating}
          subtitle="+0.2 vs mes anterior"
          color="success"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Bar chart — reservas por servicio */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-base font-bold text-gray-900 mb-5">
            Reservas por Tipo de Servicio
          </h3>
          <div className="space-y-4">
            {BOOKINGS_BY_SERVICE.map((item) => (
              <div key={item.label}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm font-medium text-gray-700">
                    {item.label}
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    {item.value}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div
                    className="h-2.5 rounded-full transition-all"
                    style={{
                      width: `${(item.value / maxService) * 100}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bar chart — tendencia semanal */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-base font-bold text-gray-900 mb-5">
            Tendencia de Reservas — Última Semana
          </h3>
          <div className="flex items-end gap-3 h-40">
            {WEEKLY_TREND.map((d) => (
              <div
                key={d.day}
                className="flex-1 flex flex-col items-center gap-1"
              >
                <span className="text-xs font-semibold text-gray-700">
                  {d.value}
                </span>
                <div
                  className="w-full rounded-t-lg transition-all"
                  style={{
                    height: `${(d.value / maxBar) * 120}px`,
                    backgroundColor: '#ff4c41',
                    opacity: 0.85,
                  }}
                />
                <span className="text-xs text-gray-400">{d.day}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
        <h3 className="text-base font-bold text-gray-900 mb-4">
          Resumen Financiero
        </h3>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
              <th className="text-left py-2 text-gray-500 font-semibold">
                Métrica
              </th>
              <th className="text-right py-2 text-gray-500 font-semibold">
                Valor
              </th>
              <th className="text-right py-2 text-gray-500 font-semibold">
                Cambio
              </th>
            </tr>
          </thead>
          <tbody>
            {FINANCIAL_ROWS.map((row) => (
              <tr key={row.label} style={{ borderBottom: '1px solid #f9fafb' }}>
                <td className="py-3 text-gray-700">{row.label}</td>
                <td className="py-3 text-right font-bold text-gray-900">
                  {row.value}
                </td>
                <td
                  className="py-3 text-right font-semibold text-sm"
                  style={{
                    color:
                      row.up === true
                        ? '#22C55E'
                        : row.up === false
                        ? '#EF4444'
                        : '#F59E0B',
                  }}
                >
                  {row.change}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Button variant="ghost" onClick={() => router.push('/')}>
        ← Volver al Dashboard
      </Button>
    </AdminLayout>
  );
}
