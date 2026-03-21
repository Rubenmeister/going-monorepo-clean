'use client';
export const dynamic = 'force-dynamic';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';
import { Button, Card, CardBody } from '@going-monorepo-clean/shared-ui';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  AdminLayout,
  DataTable,
  renderStatusBadge,
  StatCard,
  type ColumnDef,
} from '../components';
import { Loading, ErrorState } from '@going-monorepo-clean/shared-ui';

interface Booking {
  id: string;
  userId: string;
  serviceType: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  totalPrice?: { amount: number };
  createdAt: string;
}

export default function BookingsManagementPage() {
  const { auth } = useMonorepoApp();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.user) {
      router.push('/login');
      return;
    }

    const loadBookings = async () => {
      try {
        // TODO: Fetch from backend
        setBookings([
          {
            id: 'BK001',
            userId: 'USR001',
            serviceType: 'Ride',
            status: 'confirmed',
            totalPrice: { amount: 45.5 },
            createdAt: '2025-01-20T14:30:00Z',
          },
          {
            id: 'BK002',
            userId: 'USR002',
            serviceType: 'Service',
            status: 'pending',
            totalPrice: { amount: 75.0 },
            createdAt: '2025-01-20T10:15:00Z',
          },
          {
            id: 'BK003',
            userId: 'USR003',
            serviceType: 'Ride',
            status: 'completed',
            totalPrice: { amount: 32.0 },
            createdAt: '2025-01-19T18:45:00Z',
          },
        ]);
        setLoading(false);
      } catch (error) {
        console.error('Error loading bookings:', error);
        setError('Error al cargar reservas');
        setLoading(false);
      }
    };

    loadBookings();
  }, [auth.user, router]);

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

  const stats = {
    total: bookings.length,
    confirmed: bookings.filter((b) => b.status === 'confirmed').length,
    pending: bookings.filter((b) => b.status === 'pending').length,
    completed: bookings.filter((b) => b.status === 'completed').length,
  };

  const columns: ColumnDef<Booking>[] = [
    { key: 'id', label: 'ID Reserva' },
    { key: 'userId', label: 'Usuario' },
    { key: 'serviceType', label: 'Tipo de Servicio' },
    {
      key: 'status',
      label: 'Estado',
      render: (status) => renderStatusBadge(status),
    },
    {
      key: 'totalPrice',
      label: 'Precio',
      render: (price) => `$${price?.amount?.toFixed(2) || '0.00'}`,
    },
    {
      key: 'createdAt',
      label: 'Fecha',
      render: (date) => new Date(date).toLocaleDateString('es-ES'),
    },
  ];

  if (error) {
    return (
      <AdminLayout userName={auth.user.firstName}>
        <ErrorState
          title="Error al cargar reservas"
          description={error}
          action={
            <Button onClick={() => window.location.reload()} className="mt-4">
              Reintentar
            </Button>
          }
        />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout userName={auth.user.firstName}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Gestión de Reservas
        </h1>
        <p className="text-gray-600">
          Administra todas las reservas del sistema
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon="📊"
          title="Total de Reservas"
          value={stats.total}
          color="primary"
        />
        <StatCard
          icon="✓"
          title="Confirmadas"
          value={stats.confirmed}
          color="success"
        />
        <StatCard
          icon="⏳"
          title="Pendientes"
          value={stats.pending}
          color="warning"
        />
        <StatCard
          icon="✅"
          title="Completadas"
          value={stats.completed}
          color="info"
        />
      </div>

      {/* Table */}
      <DataTable<Booking>
        columns={columns}
        data={bookings}
        rowKey="id"
        loading={loading}
        emptyMessage="No hay reservas para mostrar"
        actions={(booking) => (
          <Button
            variant="primary"
            size="sm"
            onClick={() => console.log('View booking:', booking.id)}
          >
            Ver
          </Button>
        )}
      />

      {/* Back Button */}
      <div className="mt-8">
        <Button variant="ghost" onClick={() => router.push('/')}>
          ← Volver al Dashboard
        </Button>
      </div>
    </AdminLayout>
  );
}
