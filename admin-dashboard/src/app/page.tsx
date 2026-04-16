'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';
import { Card, CardBody, Button } from '@going-monorepo-clean/shared-ui';
import { useRouter } from 'next/navigation';
import { AdminLayout, StatCard } from './components';
import { Loading, ErrorState } from '@going-monorepo-clean/shared-ui';

interface AdminStats {
  total: number;
  active: number;
  suspended: number;
  admins: number;
  drivers: number;
}

const QUICK_ITEMS = [
  {
    title: 'Conductores',
    description:
      'Seguimiento GPS en tiempo real de todos los conductores activos',
    icon: '🚗',
    href: '/drivers',
    color: '#ff4c41',
  },
  {
    title: 'Clientes App',
    description: 'Gestiona usuarios individuales: activar, suspender, filtrar',
    icon: '👤',
    href: '/clients',
    color: '#3b82f6',
  },
  {
    title: 'Empresas',
    description: 'Clientes corporativos que usan la webapp empresarial Going',
    icon: '🏢',
    href: '/companies',
    color: '#8b5cf6',
  },
  {
    title: 'Reservas',
    description: 'Administra reservas activas del sistema',
    icon: '📅',
    href: '/bookings',
    color: '#10b981',
  },
  {
    title: 'Pagos',
    description: 'Revisa transacciones y estado de pagos',
    icon: '💳',
    href: '/payments',
    color: '#f59e0b',
  },
  {
    title: 'Analítica',
    description: 'Metricas de la plataforma, conversion y tendencias',
    icon: '📈',
    href: '/analytics',
    color: '#06b6d4',
  },
];

export default function DashboardPage() {
  const { auth, domain } = useMonorepoApp();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [activeDrivers, setActiveDrivers] = useState<number>(0);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    if (auth.isLoading) return;
    if (!auth.user) {
      router.push('/login');
      return;
    }
    if (!auth.user.isAdmin?.()) return;

    Promise.all([domain.admin.getStats(), domain.tracking.getActiveDrivers()])
      .then(([adminStats, drivers]) => {
        setStats(adminStats as AdminStats);
        const driversArr = Array.isArray(drivers)
          ? drivers
          : (drivers as { drivers?: unknown[] } | null)?.drivers ?? [];
        setActiveDrivers(driversArr.length);
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Error al cargar estadísticas';
        console.error('[Dashboard] Error cargando stats:', msg);
        setStatsError(msg);
      })
      .finally(() => setStatsLoading(false));
  }, [auth.isLoading, auth.user]);

  if (auth.isLoading) {
    return <Loading fullHeight size="lg" message="Verificando sesion..." />;
  }

  if (!auth.user) return null;

  if (!auth.user.isAdmin?.()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <ErrorState
          title="Acceso Denegado"
          description={`Tu rol (${auth.user.roles.join(
            ', '
          )}) no tiene permiso para acceder al panel de administracion.`}
          action={
            <Button variant="danger" onClick={auth.logout} className="mt-4">
              Cerrar Sesion
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <AdminLayout userName={auth.user.firstName} onLogout={auth.logout}>
      {statsError && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
          <span>⚠️</span>
          <span>No se pudieron cargar las estadísticas: {statsError}</span>
        </div>
      )}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">
          Bienvenido, {auth.user.firstName}
        </h1>
        <p className="text-gray-500">
          Panel de control interno - Going Platform
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon="👥"
          title="Usuarios Totales"
          value={statsLoading ? '...' : String(stats?.total ?? 0)}
          subtitle="Registrados"
          trend={{ direction: 'up', percentage: 8 }}
          color="primary"
        />
        <StatCard
          icon="✅"
          title="Usuarios Activos"
          value={statsLoading ? '...' : String(stats?.active ?? 0)}
          subtitle="Con cuenta activa"
          trend={{ direction: 'up', percentage: 5 }}
          color="success"
        />
        <StatCard
          icon="🚗"
          title="Conductores"
          value={statsLoading ? '...' : String(stats?.drivers ?? 0)}
          subtitle={
            activeDrivers > 0
              ? activeDrivers + ' en linea ahora'
              : 'Registrados'
          }
          trend={{ direction: 'up', percentage: 12 }}
          color="primary"
        />
        <StatCard
          icon="🏢"
          title="Admins"
          value={statsLoading ? '...' : String(stats?.admins ?? 0)}
          subtitle="Admins del sistema"
          trend={{ direction: 'up', percentage: 0 }}
          color="success"
        />
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Control Interno
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {QUICK_ITEMS.map((item) => (
            <Card
              key={item.href}
              hoverable
              shadow="md"
              className="cursor-pointer"
              onClick={() => router.push(item.href)}
            >
              <CardBody>
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl"
                    style={{ backgroundColor: item.color + '20' }}
                  >
                    {item.icon}
                  </div>
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-500 mb-4">{item.description}</p>
                <button
                  className="w-full py-2 text-sm font-semibold rounded-lg text-white transition-colors"
                  style={{ backgroundColor: item.color }}
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(item.href);
                  }}
                >
                  Abrir
                </button>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>

      {stats && stats.suspended > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-semibold text-orange-800">
                {stats.suspended} usuario(s) suspendido(s)
              </p>
              <p className="text-sm text-orange-600">Revisar en Clientes App</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/clients')}
            className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg text-sm font-semibold hover:bg-orange-200 transition-colors"
          >
            Revisar
          </button>
        </div>
      )}
    </AdminLayout>
  );
}
