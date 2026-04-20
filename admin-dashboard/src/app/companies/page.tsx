'use client';
export const dynamic = 'force-dynamic';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';
import { Button } from '@going-monorepo-clean/shared-ui';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { AdminLayout, DataTable, renderStatusBadge, StatCard, type ColumnDef } from '../components';
import { Loading, ErrorState } from '@going-monorepo-clean/shared-ui';
import { adminFetch } from '../../lib/admin-api';

interface Company {
  id: string;
  name: string;
  email: string;
  ruc: string;
  status: 'active' | 'inactive' | 'suspended';
  plan: string;
  employees: number;
  createdAt: string;
}

export default function CompaniesPage() {
  const { auth } = useMonorepoApp();
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null as string | null);

  const loadCompanies = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? '' : '';
    if (!auth.user || !token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetch<any>('/corporate/companies', token);
      const list: any[] = Array.isArray(data) ? data : data?.companies ?? data?.data ?? [];
      setCompanies(list.map((c: any) => ({
        id: c.id ?? c._id ?? '—',
        name: c.name ?? c.companyName ?? '—',
        email: c.email ?? c.contactEmail ?? '—',
        ruc: c.ruc ?? c.taxId ?? '—',
        status: c.status ?? 'active',
        plan: c.plan ?? c.subscription ?? 'Básico',
        employees: c.employeeCount ?? c.employees ?? 0,
        createdAt: c.createdAt ?? new Date().toISOString(),
      })));
    } catch (e: any) {
      setError(e.message ?? 'Error al cargar empresas');
    } finally {
      setLoading(false);
    }
  }, [auth.user]);

  useEffect(() => {
    if (!auth.user) { router.push('/login'); return; }
    loadCompanies();
  }, [auth.user, router, loadCompanies]);

  if (auth.isLoading) return <Loading fullHeight size="lg" message="Verificando sesión..." />;
  if (!auth.user?.isAdmin?.()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <ErrorState title="Acceso Denegado" description="Se requiere rol de administrador"
          action={<Button onClick={() => router.push('/')}>Volver</Button>} />
      </div>
    );
  }

  const columns: ColumnDef<Company>[] = [
    { key: 'name', label: 'Empresa' },
    { key: 'email', label: 'Email' },
    { key: 'ruc', label: 'RUC' },
    { key: 'plan', label: 'Plan' },
    { key: 'employees', label: 'Empleados' },
    { key: 'status', label: 'Estado', render: (s) => renderStatusBadge(s) },
    { key: 'createdAt', label: 'Registro', render: (d) => new Date(d).toLocaleDateString('es-ES') },
  ];

  if (error) {
    return (
      <AdminLayout userName={auth.user.firstName}>
        <ErrorState title="Error al cargar empresas" description={error}
          action={<Button onClick={loadCompanies} className="mt-4">Reintentar</Button>} />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout userName={auth.user.firstName}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Empresas Corporativas</h1>
        <p className="text-gray-600">Clientes corporativos activos en Going</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard icon="🏢" title="Total Empresas" value={companies.length} color="primary" />
        <StatCard icon="✅" title="Activas" value={companies.filter(c => c.status === 'active').length} color="success" />
        <StatCard icon="👥" title="Total Empleados" value={companies.reduce((s, c) => s + c.employees, 0)} color="info" />
      </div>
      <DataTable<Company> columns={columns} data={companies} rowKey="id" loading={loading}
        emptyMessage="No hay empresas registradas"
        actions={(c) => (
          <Button variant="primary" size="sm" onClick={() => router.push(`/empresas/auth/login`)}>Ver Portal</Button>
        )} />
      <div className="mt-8">
        <Button variant="ghost" onClick={() => router.push('/')}>← Volver al Dashboard</Button>
      </div>
    </AdminLayout>
  );
}
