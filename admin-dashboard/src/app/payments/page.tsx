'use client';
export const dynamic = 'force-dynamic';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';
import { Button } from '@going-monorepo-clean/shared-ui';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { AdminLayout, DataTable, renderStatusBadge, StatCard, type ColumnDef } from '../components';
import { Loading, ErrorState } from '@going-monorepo-clean/shared-ui';
import { adminFetch } from '../../lib/admin-api';

interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'pending' | 'failed';
  method?: string;
  createdAt: string;
}

export default function PaymentsManagementPage() {
  const { auth } = useMonorepoApp();
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null as string | null);

  const loadPayments = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? '' : '';
    if (!auth.user || !token) return;
    setLoading(true);
    setError(null);
    try {
      // Billing service invoices as proxy for payments
      const data = await adminFetch<any>('/invoices', token);
      const list: any[] = Array.isArray(data) ? data : data?.invoices ?? data?.data ?? [];
      setPayments(list.map((inv: any) => ({
        id: inv.id ?? inv._id ?? '—',
        bookingId: inv.rideId ?? inv.bookingId ?? inv.referenceId ?? '—',
        amount: inv.amount ?? inv.total ?? inv.subtotal ?? 0,
        currency: inv.currency ?? 'USD',
        status: inv.status === 'paid' ? 'succeeded' : inv.status === 'pending' ? 'pending' : inv.status ?? 'pending',
        method: inv.paymentMethod ?? inv.method ?? '—',
        createdAt: inv.createdAt ?? inv.issuedAt ?? new Date().toISOString(),
      })));
    } catch (e: any) {
      setError(e.message ?? 'Error al cargar pagos');
    } finally {
      setLoading(false);
    }
  }, [auth.user]);

  useEffect(() => {
    if (!auth.user) { router.push('/login'); return; }
    loadPayments();
  }, [auth.user, router, loadPayments]);

  if (auth.isLoading) return <Loading fullHeight size="lg" message="Verificando sesión..." />;
  if (!auth.user?.isAdmin?.()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <ErrorState title="Acceso Denegado" description="Se requiere rol de administrador"
          action={<Button onClick={() => router.push('/')}>Volver</Button>} />
      </div>
    );
  }

  const total = payments.reduce((s, p) => s + p.amount, 0);
  const stats = {
    succeeded: payments.filter(p => p.status === 'succeeded').length,
    pending: payments.filter(p => p.status === 'pending').length,
    failed: payments.filter(p => p.status === 'failed').length,
  };

  const columns: ColumnDef<Payment>[] = [
    { key: 'id', label: 'ID' },
    { key: 'bookingId', label: 'Reserva' },
    { key: 'amount', label: 'Monto', render: (a) => `$${Number(a).toFixed(2)}` },
    { key: 'currency', label: 'Moneda' },
    { key: 'method', label: 'Método' },
    { key: 'status', label: 'Estado', render: (s) => renderStatusBadge(s) },
    { key: 'createdAt', label: 'Fecha', render: (d) => new Date(d).toLocaleDateString('es-ES') },
  ];

  if (error) {
    return (
      <AdminLayout userName={auth.user.firstName}>
        <ErrorState title="Error al cargar pagos" description={error}
          action={<Button onClick={loadPayments} className="mt-4">Reintentar</Button>} />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout userName={auth.user.firstName}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Pagos</h1>
        <p className="text-gray-600">Historial de transacciones del sistema</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard icon="💰" title="Total Cobrado" value={`$${total.toFixed(2)}`} color="primary" />
        <StatCard icon="✅" title="Exitosos" value={stats.succeeded} color="success" />
        <StatCard icon="⏳" title="Pendientes" value={stats.pending} color="warning" />
        <StatCard icon="❌" title="Fallidos" value={stats.failed} color="danger" />
      </div>
      <DataTable<Payment> columns={columns} data={payments} rowKey="id" loading={loading}
        emptyMessage="No hay pagos registrados" />
      <div className="mt-8">
        <Button variant="ghost" onClick={() => router.push('/')}>← Volver al Dashboard</Button>
      </div>
    </AdminLayout>
  );
}
