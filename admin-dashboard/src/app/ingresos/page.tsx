'use client';
export const dynamic = 'force-dynamic';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';
import { Button } from '@going-monorepo-clean/shared-ui';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { AdminLayout, StatCard } from '../components';
import { Loading, ErrorState } from '@going-monorepo-clean/shared-ui';
import { adminFetch } from '../../lib/admin-api';

interface IngresoRow {
  id: string;
  nombre: string;
  tipo: string;
  totalViajes: number;
  ingresoTotal: number;
  comisionGoing: number;
  netoConductor: number;
  estado: string;
}

export default function IngresosPage() {
  const { auth } = useMonorepoApp();
  const router = useRouter();
  const [rows, setRows] = useState<IngresoRow[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!auth.user?.token) return;
    setLoading(true);
    setError(null);
    try {
      const [statsRes, invoicesRes] = await Promise.allSettled([
        adminFetch<any>('/invoices/stats/summary', auth.user.token),
        adminFetch<any>('/invoices', auth.user.token),
      ]);

      if (statsRes.status === 'fulfilled') setSummary(statsRes.value);

      const invoices: any[] = invoicesRes.status === 'fulfilled'
        ? (Array.isArray(invoicesRes.value) ? invoicesRes.value : invoicesRes.value?.invoices ?? [])
        : [];

      // Agrupar ingresos por proveedor
      const byProvider: Record<string, IngresoRow> = {};
      for (const inv of invoices) {
        const key = inv.providerId ?? inv.driverId ?? inv.userId ?? 'desconocido';
        if (!byProvider[key]) {
          byProvider[key] = {
            id: key,
            nombre: inv.providerName ?? inv.driverName ?? key,
            tipo: inv.providerType ?? inv.serviceType ?? 'Transporte',
            totalViajes: 0,
            ingresoTotal: 0,
            comisionGoing: 0,
            netoConductor: 0,
            estado: inv.status ?? 'active',
          };
        }
        const amount = Number(inv.amount ?? inv.total ?? 0);
        const commission = amount * 0.15;
        byProvider[key].totalViajes += 1;
        byProvider[key].ingresoTotal += amount;
        byProvider[key].comisionGoing += commission;
        byProvider[key].netoConductor += amount - commission;
      }
      setRows(Object.values(byProvider));
    } catch (e: any) {
      setError(e.message ?? 'Error al cargar ingresos');
    } finally {
      setLoading(false);
    }
  }, [auth.user]);

  useEffect(() => {
    if (!auth.user) { router.push('/login'); return; }
    load();
  }, [auth.user, router, load]);

  if (auth.isLoading) return <Loading fullHeight size="lg" message="Verificando sesión..." />;
  if (!auth.user?.isAdmin?.()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <ErrorState title="Acceso Denegado" description="Se requiere rol de administrador"
          action={<Button onClick={() => router.push('/')}>Volver</Button>} />
      </div>
    );
  }

  const totalIngresos = rows.reduce((s, r) => s + r.ingresoTotal, 0);
  const totalComision = rows.reduce((s, r) => s + r.comisionGoing, 0);
  const totalNeto = rows.reduce((s, r) => s + r.netoConductor, 0);

  if (error) {
    return (
      <AdminLayout userName={auth.user.firstName}>
        <ErrorState title="Error al cargar ingresos" description={error}
          action={<Button onClick={load} className="mt-4">Reintentar</Button>} />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout userName={auth.user.firstName}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Ingresos y Comisiones</h1>
        <p className="text-gray-600">Desglose de ingresos por proveedor</p>
      </div>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard icon="💰" title="Ingresos Totales" value={`$${totalIngresos.toFixed(2)}`} color="primary" />
          <StatCard icon="📊" title="Comisión Going (15%)" value={`$${totalComision.toFixed(2)}`} color="success" />
          <StatCard icon="🚗" title="Pago Proveedores" value={`$${totalNeto.toFixed(2)}`} color="info" />
          <StatCard icon="👥" title="Proveedores" value={rows.length} color="warning" />
        </div>
      )}

      {loading ? (
        <Loading size="lg" message="Cargando ingresos..." />
      ) : rows.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center text-gray-400 border border-gray-100">
          <div className="text-4xl mb-3">📊</div>
          <p>No hay datos de ingresos disponibles aún</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Proveedor', 'Tipo', 'Viajes', 'Ingreso Total', 'Comisión Going', 'Neto Proveedor'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map(r => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{r.nombre}</td>
                  <td className="px-4 py-3 text-gray-500">{r.tipo}</td>
                  <td className="px-4 py-3 text-gray-700">{r.totalViajes}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">${r.ingresoTotal.toFixed(2)}</td>
                  <td className="px-4 py-3 text-green-600">${r.comisionGoing.toFixed(2)}</td>
                  <td className="px-4 py-3 text-blue-600">${r.netoConductor.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-8">
        <Button variant="ghost" onClick={() => router.push('/')}>← Volver al Dashboard</Button>
      </div>
    </AdminLayout>
  );
}
