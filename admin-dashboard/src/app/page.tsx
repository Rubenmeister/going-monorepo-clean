'use client';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';
import { Card, CardBody, Button, Alert } from '@going-monorepo-clean/shared-ui';
import { useRouter } from 'next/navigation';
import { AdminLayout, StatCard } from './components';
import {
  Loading,
  EmptyState,
  ErrorState,
} from '@going-monorepo-clean/shared-ui';

export default function DashboardPage() {
  const { auth } = useMonorepoApp();
  const router = useRouter();

  // 1. Lógica de Redirección y Seguridad
  if (auth.isLoading) {
    return <Loading fullHeight size="lg" message="Verificando sesión..." />;
  }

  // Si no está logueado, redirigir a la página de login
  if (!auth.user) {
    router.push('/login');
    return null;
  }

  // 2. Comprobación de Rol (La Seguridad del Dashboard)
  if (!auth.user.isAdmin?.()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <ErrorState
          title="Acceso Denegado"
          description={`Tu rol (${auth.user.roles.join(
            ', '
          )}) no tiene permiso para acceder al panel de administración.`}
          action={
            <Button variant="danger" onClick={auth.logout} className="mt-4">
              Cerrar Sesión
            </Button>
          }
        />
      </div>
    );
  }

  // 3. Renderizado del Dashboard (Solo si es Admin)
  const menuItems = [
    {
      title: 'Reservas',
      description: 'Gestiona todas las reservas del sistema',
      icon: '📊',
      href: '/bookings',
      stats: '12 activas',
    },
    {
      title: 'Usuarios',
      description: 'Administra usuarios y roles',
      icon: '👥',
      href: '/users',
      stats: '234 usuarios',
    },
    {
      title: 'Pagos',
      description: 'Revisa transacciones de pago',
      icon: '💳',
      href: '/payments',
      stats: '$12,500 hoy',
    },
  ];

  return (
    <AdminLayout userName={auth.user.firstName} onLogout={auth.logout}>
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Bienvenido, {auth.user.firstName}
        </h1>
        <p className="text-gray-600">
          Aquí puedes gestionar todos los aspectos de la plataforma
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          icon="📊"
          title="Reservas Totales"
          value="156"
          subtitle="Este mes"
          trend={{ direction: 'up', percentage: 12 }}
          color="primary"
        />
        <StatCard
          icon="👥"
          title="Usuarios Activos"
          value="234"
          subtitle="Registrados"
          trend={{ direction: 'up', percentage: 8 }}
          color="success"
        />
        <StatCard
          icon="💰"
          title="Ingresos"
          value="$12,500"
          subtitle="Este mes"
          trend={{ direction: 'up', percentage: 15 }}
          color="success"
        />
      </div>

      {/* Quick Access */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Acceso Rápido</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {menuItems.map((item) => (
            <Card
              key={item.href}
              hoverable
              shadow="md"
              className="cursor-pointer"
              onClick={() => router.push(item.href)}
            >
              <CardBody>
                <div className="flex items-start justify-between mb-3">
                  <div className="text-4xl">{item.icon}</div>
                  <span className="text-xs font-semibold text-going-primary bg-blue-50 px-2 py-1 rounded">
                    {item.stats}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600 mb-4">{item.description}</p>
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(item.href);
                  }}
                >
                  Ir a {item.title}
                </Button>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>

      {/* Activity Card */}
      <Card shadow="md">
        <CardBody>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Actividad Reciente
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">
                  Nueva reserva completada
                </p>
                <p className="text-sm text-gray-500">Hace 2 horas</p>
              </div>
              <span className="text-2xl">✓</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">
                  Nuevo usuario registrado
                </p>
                <p className="text-sm text-gray-500">Hace 5 horas</p>
              </div>
              <span className="text-2xl">👤</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Pago procesado</p>
                <p className="text-sm text-gray-500">Hace 1 día</p>
              </div>
              <span className="text-2xl">💳</span>
            </div>
          </div>
        </CardBody>
      </Card>
    </AdminLayout>
  );
}
