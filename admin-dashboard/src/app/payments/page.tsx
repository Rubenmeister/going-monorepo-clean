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

interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'pending' | 'failed';
  createdAt: string;
}

export default function PaymentsManagementPage() {
  const { auth } = useMonorepoApp();
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.user) {
      router.push('/login');
      return;
    }

    const loadPayments = async () => {
      try {
        // TODO: Fetch from backend
        setPayments([
          {
            id: 'pay_1',
            bookingId: 'booking_1',
            amount: 150.0,
            currency: 'USD',
            status: 'succeeded',
            createdAt: '2025-01-10T10:30:00Z',
          },
          {
            id: 'pay_2',
            bookingId: 'booking_2',
            amount: 200.0,
            currency: 'USD',
            status: 'pending',
            createdAt: '2025-01-15T14:20:00Z',
          },
          {
            id: 'pay_3',
            bookingId: 'booking_3',
            amount: 85.5,
            currency: 'USD',
            status: 'succeeded',
            createdAt: '2025-01-20T09:45:00Z',
          },
        ]);
        setLoading(false);
      } catch (error) {
        console.error('Error loading payments:', error);
        setError('Error al cargar pagos');
        setLoading(false);
      }
    };

    loadPayments();
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
    total: payments.length,
    succeeded: payments.filter((p) => p.status === 'succeeded').length,
    pending: payments.filter((p) => p.status === 'pending').length,
    failed: payments.filter((p) => p.status === 'failed').length,
    totalAmount: payments
      .filter((p) => p.status === 'succeeded')
      .reduce((sum, p) => sum + p.amount, 0),
  };

  const columns: ColumnDef<Payment>[] = [
    { key: 'id', label: 'ID Pago' },
    { key: 'bookingId', label: 'Reserva' },
    {
      key: 'amount',
      label: 'Monto',
      render: (amount, payment) => `$${amount.toFixed(2)} ${payment.currency}`,
    },
    {
      key: 'status',
      label: 'Estado',
      render: (status) => renderStatusBadge(status),
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
          title="Error al cargar pagos"
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
          Gestión de Pagos
        </h1>
        <p className="text-gray-600">
          Administra todas las transacciones de pago del sistema
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon="💳"
          title="Total de Pagos"
          value={stats.total}
          color="primary"
        />
        <StatCard
          icon="✓"
          title="Exitosos"
          value={stats.succeeded}
          color="success"
        />
        <StatCard
          icon="⏳"
          title="Pendientes"
          value={stats.pending}
          color="warning"
        />
        <StatCard
          icon="💰"
          title="Total Recaudado"
          value={`$${stats.totalAmount.toFixed(2)}`}
          color="success"
        />
      </div>

      {/* Table */}
      <DataTable<Payment>
        columns={columns}
        data={payments}
        rowKey="id"
        loading={loading}
        emptyMessage="No hay pagos para mostrar"
        actions={(payment) => (
          <Button
            variant="primary"
            size="sm"
            onClick={() => console.log('View payment:', payment.id)}
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
