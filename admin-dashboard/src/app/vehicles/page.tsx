'use client';
export const dynamic = 'force-dynamic';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';
import { Button } from '@going-monorepo-clean/shared-ui';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { AdminLayout, DataTable, renderStatusBadge, StatCard, type ColumnDef } from '../components';
import { Loading, ErrorState } from '@going-monorepo-clean/shared-ui';
import { adminFetch } from '../../lib/admin-api';

interface Vehicle {
  id: string;
  driverName: string;
  plate: string;
  brand: string;
  model: string;
  year: string;
  type: string;
  status: string;
  soatExpiry?: string;
  matriculaExpiry?: string;
}

function docStatus(expiry?: string) {
  if (!expiry) return '—';
  const diff = new Date(expiry).getTime() - Date.now();
  const days = Math.floor(diff / 86400000);
  if (days < 0) return <span className="text-red-600 font-semibold">Vencido</span>;
  if (days < 30) return <span className="text-yellow-600 font-semibold">Vence en {days}d</span>;
  return <span className="text-green-600">Vigente</span>;
}

export default function VehiclesPage() {
  const { auth } = useMonorepoApp();
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null as string | null);

  const loadVehicles = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? '' : '';
    if (!auth.user || !token) return;
    setLoading(true);
    setError(null);
    try {
      // Use admin users endpoint filtered by role=driver, extract vehicle data
      const data = await adminFetch<any>('/auth/admin/users?role=driver&limit=100', token);
      const drivers: any[] = Array.isArray(data) ? data : data?.users ?? data?.data ?? [];
      setVehicles(drivers
        .filter((d: any) => d.vehicle || d.vehicleType)
        .map((d: any) => ({
          id: d.id ?? d._id ?? '—',
          driverName: `${d.firstName ?? ''} ${d.lastName ?? ''}`.trim() || d.name || '—',
          plate: d.vehicle?.plate ?? d.plate ?? '—',
          brand: d.vehicle?.brand ?? d.vehicleBrand ?? '—',
          model: d.vehicle?.model ?? d.vehicleModel ?? '—',
          year: d.vehicle?.year ?? d.vehicleYear ?? '—',
          type: d.vehicle?.type ?? d.vehicleType ?? '—',
          status: d.driverStatus ?? d.status ?? 'active',
          soatExpiry: d.vehicle?.soatExpiry ?? d.soatExpiry,
          matriculaExpiry: d.vehicle?.matriculaExpiry ?? d.matriculaExpiry,
        })));
    } catch (e: any) {
      setError(e.message ?? 'Error al cargar vehículos');
    } finally {
      setLoading(false);
    }
  }, [auth.user]);

  useEffect(() => {
    if (!auth.user) { router.push('/login'); return; }
    loadVehicles();
  }, [auth.user, router, loadVehicles]);

  if (auth.isLoading) return <Loading fullHeight size="lg" message="Verificando sesión..." />;
  if (!auth.user?.isAdmin?.()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <ErrorState title="Acceso Denegado" description="Se requiere rol de administrador"
          action={<Button onClick={() => router.push('/')}>Volver</Button>} />
      </div>
    );
  }

  const columns: ColumnDef<Vehicle>[] = [
    { key: 'driverName', label: 'Conductor' },
    { key: 'plate', label: 'Placa' },
    { key: 'brand', label: 'Marca / Modelo', render: (b, row) => `${b} ${row.model}` },
    { key: 'year', label: 'Año' },
    { key: 'type', label: 'Tipo' },
    { key: 'status', label: 'Estado', render: (s) => renderStatusBadge(s) },
    { key: 'soatExpiry', label: 'SOAT', render: (d) => docStatus(d) as any },
    { key: 'matriculaExpiry', label: 'Matrícula', render: (d) => docStatus(d) as any },
  ];

  if (error) {
    return (
      <AdminLayout userName={auth.user.firstName}>
        <ErrorState title="Error al cargar vehículos" description={error}
          action={<Button onClick={loadVehicles} className="mt-4">Reintentar</Button>} />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout userName={auth.user.firstName}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Flota de Vehículos</h1>
        <p className="text-gray-600">Vehículos registrados por conductores activos</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard icon="🚗" title="Total Vehículos" value={vehicles.length} color="primary" />
        <StatCard icon="⚠️" title="Doc. por vencer" value={vehicles.filter(v => {
          const s = v.soatExpiry; if (!s) return false;
          return (new Date(s).getTime() - Date.now()) < 30 * 86400000;
        }).length} color="warning" />
        <StatCard icon="✅" title="Activos" value={vehicles.filter(v => v.status === 'active').length} color="success" />
      </div>
      <DataTable<Vehicle> columns={columns} data={vehicles} rowKey="id" loading={loading}
        emptyMessage="No hay vehículos registrados" />
      <div className="mt-8">
        <Button variant="ghost" onClick={() => router.push('/')}>← Volver al Dashboard</Button>
      </div>
    </AdminLayout>
  );
}
