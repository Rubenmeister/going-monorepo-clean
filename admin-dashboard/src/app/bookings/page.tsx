'use client';
export const dynamic = 'force-dynamic';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';
import { Button } from '@going-monorepo-clean/shared-ui';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { AdminLayout, DataTable, renderStatusBadge, StatCard, type ColumnDef } from '../components';
import { Loading, ErrorState } from '@going-monorepo-clean/shared-ui';
import { adminFetch } from '../../lib/admin-api';

interface Booking {
  id: string;
  userId: string;
  serviceType: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  totalPrice?: { amount: number };
  price?: number;
  createdAt: string;
}

export default function BookingsManagementPage() {
  const { auth } = useMonorepoApp();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null as string | null);

  const loadBookings = useCallback(async () => {
    if (!auth.user?.token) return;
    setLoading(true);
    setError(null);
    try {
      // Rides history + pending trips
      const [pending, stats] = await Promise.allSettled([
        adminFetch<any[]>('/transport/pending', auth.user.token),
        adminFetch<{ rides?: any[] }>('/auth/admin/stats', auth.user.token),
      ]);

      const pendingData = pending.status === 'fulfilled' ? pending.value ?? [] : [];
      const statsRides = stats.status === 'fulfilled' ? stats.value?.rides ?? [] : [];

      const all: Booking[] = [...pendingData, ...statsRides].map((r: any) => ({
        id: r.id ?? r._id ?? r.rideId ?? '—',
        userId: r.userId ?? r.passengerId ?? '—',
        serviceType: r.serviceType ?? r.tripMode ?? 'Transporte',
        status: r.status ?? 'pending',
        totalPrice: { amount: r.price ?? r.totalPrice?.amount ?? r.fare ?? 0 },
        createdAt: r.createdAt ?? r.requestedAt ?? new Date().toISOString(),
      }));

      setBookings(all);
    } catch (e: any) {
      setError(e.message ?? 'Error al cargar reservas');
    } finally {
      setLoading(false);
    }
  }, [auth.user]);

  useEffect(() => {
    if (!auth.user) { router.push('/login'); return; }
    loadBookings();
  }, [auth.user, router, loadBookings]);

  if (auth.isLoading) return <Loading fullHeight size="lg" message="Verificando sesión..." />;
  if (!auth.user?.isAdmin?.()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <ErrorState title="Acceso Denegado" description="Se requiere rol de administrador"
          action={<Button onClick={() => router.push('/')}>Volver</Button>} />
      </div>
    );
  }

  const stats = {
    total: bookings.length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    pending: bookings.filter(b => b.status === 'pending').length,
    completed: bookings.filter(b => b.status === 'completed').length,
  };

  const columns: ColumnDef<Booking>[] = [
    { key: 'id', label: 'ID Reserva' },
    { key: 'userId', label: 'Usuario' },
    { key: 'serviceType', label: 'Tipo' },
    { key: 'status', label: 'Estado', render: (s) => renderStatusBadge(s) },
    { key: 'totalPrice', label: 'Precio', render: (p) => `$${p?.amount?.toFixed(2) ?? '0.00'}` },
    { key: 'createdAt', label: 'Fecha', render: (d) => new Date(d).toLocaleDateString('es-ES') },
  ];

  if (error) {
    return (
      <AdminLayout userName={auth.user.firstName}>
        <ErrorState title="Error al cargar reservas" description={error}
          action={<Button onClick={loadBookings} className="mt-4">Reintentar</Button>} />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout userName={auth.user.firstName}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Reservas</h1>
        <p className="text-gray-600">Viajes activos y pendientes del sistema</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard icon="📊" title="Total" value={stats.total} color="primary" />
        <StatCard icon="✓" title="Confirmadas" value={stats.confirmed} color="success" />
        <StatCard icon="⏳" title="Pendientes" value={stats.pending} color="warning" />
        <StatCard icon="✅" title="Completadas" value={stats.completed} color="info" />
      </div>
      <DataTable<Booking> columns={columns} data={bookings} rowKey="id" loading={loading}
        emptyMessage="No hay reservas activas"
        actions={(b) => (
          <Button variant="primary" size="sm" onClick={() => console.log('Ver:', b.id)}>Ver</Button>
        )} />
      <div className="mt-8">
        <Button variant="ghost" onClick={() => router.push('/')}>← Volver al Dashboard</Button>
      </div>
    </AdminLayout>
  );
}
