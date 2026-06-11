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
  const [updatingId, setUpdatingId] = useState(null as string | null);
  const [page, setPage] = useState(0);
  const [viewMode, setViewMode] = useState<'list' | 'segments'>('list');
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

  /* ── Segmentation ── */
  const now = Date.now();
  const DAY = 86400000;
  const segments = {
    nuevos:     users.filter(u => now - new Date(u.createdAt).getTime() < 30 * DAY),
    activos:    users.filter(u => u.status === 'active' && now - new Date(u.createdAt).getTime() >= 30 * DAY),
    pendientes: users.filter(u => u.status === 'pending_verification'),
    suspendidos:users.filter(u => u.status === 'suspended'),
  };
  const retentionRate = total > 0 ? ((segments.activos.length / total) * 100).toFixed(1) : '0';
  const newRate       = total > 0 ? ((segments.nuevos.length / total) * 100).toFixed(1) : '0';

  /* Monthly registration trend (last 6 months from loaded users) */
  const monthlyMap: Record<string,number> = {};
  users.forEach(u => {
    const d = new Date(u.createdAt);
    const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    monthlyMap[k] = (monthlyMap[k]??0)+1;
  });
  const monthlyTrend = Object.entries(monthlyMap).sort((a,b)=>a[0].localeCompare(b[0])).slice(-6);
  const maxMonthly   = Math.max(...monthlyTrend.map(([,v])=>v), 1);

  return (
    <AdminLayout
      userName={auth.user?.firstName ?? 'Admin'}
      onLogout={auth.logout}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes de la App</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} personas usuarias registradas en total</p>
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {(['list','segments'] as const).map(m => (
            <button key={m} onClick={() => setViewMode(m)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${viewMode===m?'bg-white shadow-sm text-gray-900':'text-gray-500 hover:text-gray-700'}`}>
              {m==='list' ? '📋 Lista' : '📊 Segmentos'}
            </button>
          ))}
        </div>
      </div>

      {/* ── SEGMENTS VIEW ── */}
      {viewMode === 'segments' && (
        <div className="space-y-6 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {label:'Nuevos (últimos 30d)', value:segments.nuevos.length,     pct:newRate,       color:'text-blue-600',   bg:'bg-blue-50',   icon:'🆕'},
              {label:'Activos',              value:segments.activos.length,    pct:retentionRate, color:'text-green-600',  bg:'bg-green-50',  icon:'✅'},
              {label:'Pendientes',           value:segments.pendientes.length, pct:(total>0?((segments.pendientes.length/total)*100).toFixed(1):'0'), color:'text-amber-600',  bg:'bg-amber-50',  icon:'⏳'},
              {label:'Suspendidos',          value:segments.suspendidos.length,pct:(total>0?((segments.suspendidos.length/total)*100).toFixed(1):'0'), color:'text-red-600',    bg:'bg-red-50',    icon:'🚫'},
            ].map(s => (
              <div key={s.label} className={`rounded-2xl border border-gray-100 p-5 shadow-sm ${s.bg}`}>
                <p className="text-xs text-gray-500">{s.icon} {s.label}</p>
                <p className={`text-2xl font-black mt-1 ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-400 mt-1">{s.pct}% del total</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Trend chart */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-base font-bold text-gray-900 mb-4">📅 Registros por mes</h3>
              {monthlyTrend.length === 0 ? (
                <p className="text-sm text-gray-400">Sin suficientes datos</p>
              ) : (
                <div className="flex items-end gap-2 h-32">
                  {monthlyTrend.map(([month,count]) => (
                    <div key={month} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] font-bold text-gray-600">{count}</span>
                      <div className="w-full flex flex-col justify-end" style={{height:'96px'}}>
                        <div className="w-full rounded-t-md bg-blue-500"
                          style={{height:`${Math.max((count/maxMonthly)*96,4)}px`, opacity:0.5+(count/maxMonthly)*0.5}} />
                      </div>
                      <span className="text-[9px] text-gray-400">{month.slice(5)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Health metrics */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-base font-bold text-gray-900 mb-4">❤️ Salud de la base de usuarios</h3>
              <div className="space-y-4">
                {[
                  {label:'Tasa de activación', value:retentionRate+'%', color:'#22c55e', pct:parseFloat(retentionRate)},
                  {label:'Nuevos este mes',    value:newRate+'%',       color:'#0033A0', pct:parseFloat(newRate)},
                  {label:'Tasa de suspensión', value:(total>0?((segments.suspendidos.length/total)*100).toFixed(1):'0')+'%', color:'#ef4444', pct:total>0?(segments.suspendidos.length/total)*100:0},
                ].map(m => (
                  <div key={m.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{m.label}</span>
                      <span className="font-bold" style={{color:m.color}}>{m.value}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="h-2 rounded-full" style={{width:`${Math.min(m.pct,100)}%`, backgroundColor:m.color}} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  <strong>Interpretación:</strong> Usuarios con status activo y más de 30 días registrados se consideran activados. Los nuevos son registros de los últimos 30 días.
                </p>
              </div>
            </div>
          </div>

          {/* Segment detail lists */}
          {segments.suspendidos.length > 0 && (
            <div className="bg-red-50 rounded-2xl border border-red-100 p-6">
              <h3 className="text-base font-bold text-red-800 mb-3">🚫 Usuarios suspendidos ({segments.suspendidos.length})</h3>
              <div className="flex flex-wrap gap-2">
                {segments.suspendidos.slice(0,20).map(u => (
                  <span key={u.id} className="px-3 py-1 bg-white border border-red-200 rounded-full text-xs text-red-700 font-medium">
                    {u.firstName} {u.lastName}
                  </span>
                ))}
                {segments.suspendidos.length>20 && <span className="px-3 py-1 bg-white border border-red-200 rounded-full text-xs text-red-400">+{segments.suspendidos.length-20} más</span>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters — only in list mode */}
      {viewMode === 'list' && <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6 flex flex-wrap gap-3">
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
      </div>}

      {/* Table */}
      {viewMode === 'list' &&
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
      </div>}
    </AdminLayout>
  );
}
