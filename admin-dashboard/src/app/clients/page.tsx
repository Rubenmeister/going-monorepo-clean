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

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  suspended: 'bg-red-100 text-red-700',
  pending_verification: 'bg-yellow-100 text-yellow-700',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Activo',
  suspended: 'Suspendido',
  pending_verification: 'Pendiente',
};

export default function ClientsPage() {
  const { auth, domain } = useMonorepoApp();
  const router = useRouter();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  useEffect(() => {
    if (!auth.isLoading && !auth.user) router.push('/login');
  }, [auth.isLoading, auth.user, router]);

  useEffect(() => {
    setLoading(true);
    domain.admin
      .getUsers({
        limit: PAGE_SIZE,
        skip: page * PAGE_SIZE,
        status: filterStatus || undefined,
        role: filterRole || undefined,
      })
      .then((res: { users: UserRecord[]; total: number }) => {
        setUsers(res.users ?? []);
        setTotal(res.total ?? 0);
      })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [page, filterStatus, filterRole]);

  const handleStatusChange = async (user: UserRecord, newStatus: string) => {
    setUpdatingId(user.id);
    try {
      await domain.admin.updateUserStatus(user.id, newStatus);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))
      );
    } catch {
      alert('Error actualizando estado');
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      !q ||
      u.email.toLowerCase().includes(q) ||
      u.firstName.toLowerCase().includes(q) ||
      u.lastName.toLowerCase().includes(q)
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
            Clientes de la App
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {total} usuarios registrados en total
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-48 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
        />
        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setPage(0);
          }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none"
        >
          <option value="">Todos los estados</option>
          <option value="active">Activos</option>
          <option value="suspended">Suspendidos</option>
          <option value="pending_verification">Pendientes</option>
        </select>
        <select
          value={filterRole}
          onChange={(e) => {
            setFilterRole(e.target.value);
            setPage(0);
          }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none"
        >
          <option value="">Todos los roles</option>
          <option value="user">Usuario</option>
          <option value="driver">Conductor</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <div className="text-4xl mb-3 animate-pulse">👥</div>
            <p>Cargando usuarios...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <div className="text-4xl mb-3">🔍</div>
            <p>No se encontraron usuarios</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">
                  Usuario
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">
                  Roles
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">
                  Estado
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">
                  Registro
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: '#ff4c41' }}
                      >
                        {user.firstName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                        {user.phone && (
                          <p className="text-xs text-gray-400">{user.phone}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(user.roles ?? []).map((role) => (
                        <span
                          key={role}
                          className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-medium"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        STATUS_STYLES[user.status] ??
                        'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {STATUS_LABELS[user.status] ?? user.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {new Date(user.createdAt).toLocaleDateString('es-CO')}
                  </td>
                  <td className="px-4 py-3">
                    {updatingId === user.id ? (
                      <span className="text-xs text-gray-400">
                        Actualizando...
                      </span>
                    ) : (
                      <div className="flex gap-2">
                        {user.status !== 'active' && (
                          <button
                            onClick={() => handleStatusChange(user, 'active')}
                            className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors font-medium"
                          >
                            Activar
                          </button>
                        )}
                        {user.status !== 'suspended' && (
                          <button
                            onClick={() =>
                              handleStatusChange(user, 'suspended')
                            }
                            className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100 transition-colors font-medium"
                          >
                            Suspender
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {total > PAGE_SIZE && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              Mostrando {page * PAGE_SIZE + 1}
              {'\u2013'}
              {Math.min((page + 1) * PAGE_SIZE, total)} de {total}
            </p>
            <div className="flex gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                disabled={(page + 1) * PAGE_SIZE >= total}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
