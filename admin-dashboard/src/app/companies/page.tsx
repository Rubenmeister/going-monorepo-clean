'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';
import { AdminLayout } from '../components';

interface UserRecord {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roles: string[];
  status: string;
  createdAt: string;
}

// Simulated company data — will be replaced by a dedicated corporate API
const MOCK_COMPANIES = [
  {
    id: 'corp-001',
    name: 'Logística Andina S.A.S',
    nit: '900.123.456-7',
    plan: 'Enterprise',
    employees: 48,
    status: 'active',
    city: 'Bogotá',
    createdAt: '2025-11-15',
    monthlyTrips: 312,
    contactEmail: 'admin@logisticaandina.co',
  },
  {
    id: 'corp-002',
    name: 'Distribuidora El Palmar',
    nit: '800.987.654-3',
    plan: 'Business',
    employees: 22,
    status: 'active',
    city: 'Medellín',
    createdAt: '2025-12-01',
    monthlyTrips: 98,
    contactEmail: 'gerencia@palmar.co',
  },
  {
    id: 'corp-003',
    name: 'Constructora Nuevo Horizonte',
    nit: '901.555.321-1',
    plan: 'Business',
    employees: 15,
    status: 'trial',
    city: 'Cali',
    createdAt: '2026-02-10',
    monthlyTrips: 24,
    contactEmail: 'ti@nuevohorizonte.co',
  },
];

const PLAN_STYLES: Record<string, string> = {
  Enterprise: 'bg-purple-100 text-purple-700',
  Business: 'bg-blue-100 text-blue-700',
  trial: 'bg-yellow-100 text-yellow-700',
};

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  suspended: 'bg-red-100 text-red-700',
  trial: 'bg-yellow-100 text-yellow-700',
};

export default function CompaniesPage() {
  const { auth, domain } = useMonorepoApp();
  const router = useRouter();
  const [corporateUsers, setCorporateUsers] = useState<UserRecord[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!auth.isLoading && !auth.user) router.push('/login');
  }, [auth.isLoading, auth.user, router]);

  useEffect(() => {
    // Fetch users with corporate/manager/super_admin roles from auth service
    domain.admin
      .getUsers({ role: 'manager' })
      .then((res: { users: UserRecord[] }) =>
        setCorporateUsers(res.users ?? [])
      )
      .catch(() => setCorporateUsers([]));
  }, []);

  const filtered = MOCK_COMPANIES.filter((c) => {
    const q = search.toLowerCase();
    return (
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q) ||
      c.contactEmail.toLowerCase().includes(q)
    );
  });

  return (
    <AdminLayout
      userName={auth.user?.firstName ?? 'Admin'}
      onLogout={auth.logout}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Clientes Empresariales
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Empresas que usan la webapp corporativa Going
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-semibold">
            🏢 {MOCK_COMPANIES.filter((c) => c.status === 'active').length}{' '}
            empresas activas
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500">Total empresas</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {MOCK_COMPANIES.length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500">Empleados gestionados</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {MOCK_COMPANIES.reduce((s, c) => s + c.employees, 0)}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500">Viajes este mes</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {MOCK_COMPANIES.reduce((s, c) => s + c.monthlyTrips, 0)}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500">Administradores corp.</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {corporateUsers.length}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
        <input
          type="text"
          placeholder="Buscar empresa, ciudad o contacto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
        />
      </div>

      {/* Companies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mb-8">
        {filtered.map((company) => (
          <div
            key={company.id}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
                style={{ backgroundColor: '#011627' }}
              >
                🏢
              </div>
              <div className="flex gap-2">
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    PLAN_STYLES[company.plan]
                  }`}
                >
                  {company.plan}
                </span>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    STATUS_STYLES[company.status]
                  }`}
                >
                  {company.status === 'active'
                    ? 'Activa'
                    : company.status === 'trial'
                    ? 'Trial'
                    : 'Suspendida'}
                </span>
              </div>
            </div>
            <h3 className="font-semibold text-gray-900 mb-0.5">
              {company.name}
            </h3>
            <p className="text-xs text-gray-400 mb-3">
              NIT: {company.nit} · {company.city}
            </p>

            <div className="grid grid-cols-2 gap-2 text-center mb-4">
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-lg font-bold text-gray-900">
                  {company.employees}
                </p>
                <p className="text-xs text-gray-400">Empleados</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-lg font-bold text-gray-900">
                  {company.monthlyTrips}
                </p>
                <p className="text-xs text-gray-400">Viajes/mes</p>
              </div>
            </div>

            <p className="text-xs text-gray-400 mb-3">
              📧 {company.contactEmail}
            </p>
            <p className="text-xs text-gray-400">
              📅 Desde {new Date(company.createdAt).toLocaleDateString('es-CO')}
            </p>

            <div className="mt-4 flex gap-2">
              <button
                className="flex-1 text-xs py-1.5 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 font-medium transition-colors"
                onClick={() => alert('Ver detalle empresa — próximamente')}
              >
                Ver detalle
              </button>
              <button
                className="flex-1 text-xs py-1.5 text-white rounded-lg font-medium transition-colors"
                style={{ backgroundColor: '#ff4c41' }}
                onClick={() => alert('Contactar empresa — próximamente')}
              >
                Contactar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Corporate Portal Integration Note */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-5 border border-indigo-100">
        <div className="flex items-start gap-4">
          <div className="text-3xl">🔗</div>
          <div>
            <h3 className="font-semibold text-indigo-900 mb-1">
              Integración con Corporate Portal
            </h3>
            <p className="text-sm text-indigo-700">
              Los datos de empresas se sincronizarán automáticamente desde el
              Corporate Portal (
              <span className="font-mono text-xs">
                corporate-portal-gamma.vercel.app
              </span>
              ) cuando el módulo de gestión empresarial esté completamente
              activado. Los administradores corporativos podrán ver viajes,
              facturación consolidada y métricas de equipo directamente desde su
              panel.
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
