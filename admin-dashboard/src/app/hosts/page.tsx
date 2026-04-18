'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';
import { AdminLayout } from '../components';
import { adminFetch, API } from '../../lib/admin-api';

/* ─── Types ─────────────────────────────────────────────────────────── */
type HostType = 'tour' | 'experiencia' | 'alojamiento' | 'mixto';
type HostTab  = 'todos' | HostType;

interface HostUser {
  id: string;
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  status: 'active' | 'suspended' | 'pending_verification' | string;
  createdAt: string;
}

interface ServiceItem {
  id: string;
  hostId: string;
  title: string;
  description?: string;
  location?: { city?: string; country?: string };
  status: 'draft' | 'published' | 'archived' | string;
  price?: { amount: number; currency: string };
  pricePerNight?: { amount: number; currency: string };
  createdAt?: string;
}

interface Host {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'suspended' | 'pending' | 'review';
  joinedAt: string;
  type: HostType;
  city: string;
  services: ServiceItem[];
  servicesCount: number;
  /* financial — solo disponibles cuando el backend lo exponga */
  totalRevenue: number | null;
  pendingPayout: number | null;
  totalBookings: number | null;
}

/* ─── Helpers ────────────────────────────────────────────────────────── */
const TYPE_ICONS: Record<string, string> = {
  alojamiento: '🏨',
  tour:        '🗺️',
  experiencia: '🎭',
  mixto:       '🌐',
};

const TYPE_COLORS: Record<string, string> = {
  alojamiento: '#f59e0b',
  tour:        '#16a34a',
  experiencia: '#8b5cf6',
  mixto:       '#0033A0',
};

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  active:               { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Activo'       },
  suspended:            { bg: 'bg-red-100',    text: 'text-red-700',    label: 'Suspendido'   },
  pending:              { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pendiente'    },
  pending_verification: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Verificando'  },
  review:               { bg: 'bg-blue-100',   text: 'text-blue-700',   label: 'En revisión'  },
};

function mapUserStatus(s: string): Host['status'] {
  if (s === 'active') return 'active';
  if (s === 'suspended') return 'suspended';
  if (s === 'pending_verification') return 'pending';
  return 'review';
}

function deriveType(accCount: number, tourCount: number, expCount: number): HostType {
  const filled = [accCount > 0, tourCount > 0, expCount > 0].filter(Boolean).length;
  if (filled > 1) return 'mixto';
  if (accCount > 0) return 'alojamiento';
  if (tourCount > 0) return 'tour';
  if (expCount > 0) return 'experiencia';
  return 'mixto';
}

/* ─── Page ───────────────────────────────────────────────────────────── */
export default function HostsPage() {
  const { auth } = useMonorepoApp();
  const router   = useRouter();

  const [hosts,       setHosts]       = useState<Host[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [activeTab,   setActiveTab]   = useState<HostTab>('todos');
  const [search,      setSearch]      = useState('');
  const [filterStatus,setFilterStatus]= useState('all');
  const [selectedHost,setSelectedHost]= useState<Host | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.isLoading && !auth.user) router.push('/login');
  }, [auth.isLoading, auth.user, router]);

  /* ── Fetch real data ── */
  const fetchHosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('authToken') ?? '';

      /* 1. Users with host role */
      const usersRes = await adminFetch<{ users?: HostUser[]; data?: HostUser[] }>(
        '/auth/admin/users?role=host&limit=200',
        token
      ).catch(() => ({ users: [] as HostUser[] }));

      const hostUsers: HostUser[] = (usersRes as any).users
        ?? (usersRes as any).data
        ?? (Array.isArray(usersRes) ? usersRes : []);

      /* 2. All published services (parallel) */
      const [accs, tours, exps] = await Promise.all([
        fetch(`${API}/accommodations/search`, { headers: { Authorization: `Bearer ${token}` } })
          .then(r => r.ok ? r.json() : []).catch(() => []),
        fetch(`${API}/tours/search`, { headers: { Authorization: `Bearer ${token}` } })
          .then(r => r.ok ? r.json() : []).catch(() => []),
        fetch(`${API}/experiences/search`, { headers: { Authorization: `Bearer ${token}` } })
          .then(r => r.ok ? r.json() : []).catch(() => []),
      ]);

      const accList:  ServiceItem[] = Array.isArray(accs)  ? accs  : (accs?.data  ?? []);
      const tourList: ServiceItem[] = Array.isArray(tours) ? tours : (tours?.data ?? []);
      const expList:  ServiceItem[] = Array.isArray(exps)  ? exps  : (exps?.data  ?? []);

      /* 3. Index services by hostId */
      const byHost: Record<string, { accs: ServiceItem[]; tours: ServiceItem[]; exps: ServiceItem[] }> = {};
      const ensure = (id: string) => {
        if (!byHost[id]) byHost[id] = { accs: [], tours: [], exps: [] };
      };
      accList.forEach(a  => { ensure(a.hostId); byHost[a.hostId].accs.push(a); });
      tourList.forEach(t => { ensure(t.hostId); byHost[t.hostId].tours.push(t); });
      expList.forEach(e  => { ensure(e.hostId); byHost[e.hostId].exps.push(e); });

      /* 4. Build Host objects */
      /* Include host users even if they have no published services yet */
      const allHostIds = new Set([
        ...hostUsers.map(u => u.id),
        ...Object.keys(byHost),
      ]);

      const userMap = Object.fromEntries(hostUsers.map(u => [u.id, u]));

      const result: Host[] = Array.from(allHostIds).map(hid => {
        const user  = userMap[hid];
        const srvs  = byHost[hid] ?? { accs: [], tours: [], exps: [] };
        const allSrvs = [...srvs.accs, ...srvs.tours, ...srvs.exps];
        const city = allSrvs[0]?.location?.city ?? '—';
        return {
          id:            hid,
          name:          user ? `${user.firstName} ${user.lastName ?? ''}`.trim() : `Host ${hid.slice(0,6)}`,
          email:         user?.email ?? '—',
          phone:         user?.phone ?? '—',
          status:        mapUserStatus(user?.status ?? 'review'),
          joinedAt:      user?.createdAt ?? '',
          type:          deriveType(srvs.accs.length, srvs.tours.length, srvs.exps.length),
          city,
          services:      allSrvs,
          servicesCount: allSrvs.length,
          totalRevenue:  null, /* requiere endpoint admin financiero */
          pendingPayout: null,
          totalBookings: null,
        };
      });

      setHosts(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando proveedores');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (auth.user) fetchHosts(); }, [auth.user, fetchHosts]);

  /* ── Actions ── */
  const handleStatus = async (hostId: string, newStatus: 'active' | 'suspended') => {
    setActionLoading(hostId);
    try {
      const token = localStorage.getItem('authToken') ?? '';
      await adminFetch(`/auth/admin/users/${hostId}/status`, token, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setHosts(prev => prev.map(h => h.id === hostId ? { ...h, status: newStatus } : h));
      if (selectedHost?.id === hostId) setSelectedHost(prev => prev ? { ...prev, status: newStatus } : null);
    } catch {
      alert('No se pudo actualizar el estado');
    } finally {
      setActionLoading(null);
    }
  };

  /* ── Derived UI ── */
  const filtered = hosts.filter(h => {
    const q       = search.toLowerCase();
    const matchQ  = !q || `${h.name} ${h.email} ${h.city}`.toLowerCase().includes(q);
    const matchTab = activeTab === 'todos' || h.type === activeTab;
    const matchSt = filterStatus === 'all' || h.status === filterStatus;
    return matchQ && matchTab && matchSt;
  });

  const counts = {
    todos:       hosts.length,
    alojamiento: hosts.filter(h => h.type === 'alojamiento').length,
    tour:        hosts.filter(h => h.type === 'tour').length,
    experiencia: hosts.filter(h => h.type === 'experiencia').length,
    mixto:       hosts.filter(h => h.type === 'mixto').length,
  };

  const TABS: { key: HostTab; label: string; icon: string }[] = [
    { key: 'todos',       label: 'Todos',        icon: '📋' },
    { key: 'alojamiento', label: 'Alojamientos', icon: '🏨' },
    { key: 'tour',        label: 'Tours',        icon: '🗺️' },
    { key: 'experiencia', label: 'Experiencias', icon: '🎭' },
    { key: 'mixto',       label: 'Mixtos',       icon: '🌐' },
  ];

  return (
    <AdminLayout userName={auth.user?.firstName ?? 'Admin'} onLogout={auth.logout}>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Anfitriones y Proveedores</h1>
          <p className="text-gray-500 text-sm mt-0.5">Tours · Experiencias · Alojamientos</p>
        </div>
        <button
          onClick={fetchHosts}
          className="px-4 py-2 text-sm font-bold text-white rounded-xl flex items-center gap-2"
          style={{ backgroundColor: '#ff4c41' }}
        >
          {loading ? '⟳ Cargando…' : '↺ Actualizar'}
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button onClick={fetchHosts} className="underline text-xs">Reintentar</button>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Total proveedores', value: counts.todos,       color: '#0033A0' },
          { label: 'Alojamientos',      value: counts.alojamiento, color: '#f59e0b' },
          { label: 'Tours',             value: counts.tour,        color: '#16a34a' },
          { label: 'Experiencias',      value: counts.experiencia, color: '#8b5cf6' },
          { label: 'Mixtos',            value: counts.mixto,       color: '#ff4c41' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500">{s.label}</p>
            {loading
              ? <div className="h-6 w-10 bg-gray-200 animate-pulse rounded mt-1" />
              : <p className="text-xl font-black mt-1" style={{ color: s.color }}>{s.value}</p>
            }
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5 w-fit overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.icon} {t.label}
            <span className="text-xs font-normal text-gray-400">({counts[t.key]})</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4 flex flex-wrap gap-3">
        <input type="text" placeholder="Buscar nombre, email, ciudad…"
          value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300" />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none">
          <option value="all">Todos los estados</option>
          <option value="active">Activo</option>
          <option value="pending">Pendiente</option>
          <option value="suspended">Suspendido</option>
          <option value="review">En revisión</option>
        </select>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 animate-pulse">
              <div className="flex gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-200 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[1,2,3].map(j => <div key={j} className="h-12 bg-gray-100 rounded-lg" />)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cards grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(h => {
            const s   = STATUS_STYLE[h.status] ?? STATUS_STYLE.review;
            const col = TYPE_COLORS[h.type];
            return (
              <div key={h.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedHost(h)}
              >
                <div className="h-1.5 w-full" style={{ backgroundColor: col }} />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                        style={{ backgroundColor: col + '20' }}>
                        {TYPE_ICONS[h.type]}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{h.name}</p>
                        <p className="text-xs text-gray-400">{h.email}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${s.bg} ${s.text}`}>{s.label}</span>
                  </div>

                  <div className="flex items-center gap-2 mb-3 text-xs text-gray-500">
                    <span>📍 {h.city}</span>
                    {h.joinedAt && (
                      <span className="ml-auto text-gray-400">
                        Desde {new Date(h.joinedAt).toLocaleDateString('es-EC')}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center mb-3">
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-sm font-bold text-gray-900">{h.servicesCount}</p>
                      <p className="text-xs text-gray-400">Servicios</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-sm font-bold text-gray-500">{h.totalBookings ?? '—'}</p>
                      <p className="text-xs text-gray-400">Reservas</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-sm font-bold text-gray-500">{h.totalRevenue != null ? `$${h.totalRevenue}` : '—'}</p>
                      <p className="text-xs text-gray-400">Ingresos</p>
                    </div>
                  </div>

                  {/* Services preview */}
                  {h.services.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {h.services.slice(0,3).map(sv => (
                        <span key={sv.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full truncate max-w-[140px]">
                          {sv.title}
                        </span>
                      ))}
                      {h.services.length > 3 && (
                        <span className="text-xs text-gray-400">+{h.services.length - 3} más</span>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 mt-3">
                    <button className="flex-1 text-xs py-1.5 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 font-medium"
                      onClick={e => { e.stopPropagation(); setSelectedHost(h); }}>
                      Ver detalle
                    </button>
                    {h.status === 'pending' && (
                      <button
                        disabled={actionLoading === h.id}
                        className="flex-1 text-xs py-1.5 text-white rounded-lg font-medium disabled:opacity-60"
                        style={{ backgroundColor: '#16a34a' }}
                        onClick={e => { e.stopPropagation(); handleStatus(h.id, 'active'); }}
                      >
                        {actionLoading === h.id ? '…' : 'Aprobar'}
                      </button>
                    )}
                    {h.status === 'active' && (
                      <button
                        disabled={actionLoading === h.id}
                        className="flex-1 text-xs py-1.5 text-white rounded-lg font-medium disabled:opacity-60"
                        style={{ backgroundColor: '#0033A0' }}
                        onClick={e => { e.stopPropagation(); setSelectedHost(h); }}
                      >
                        Gestionar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && \!loading && (
            <div className="col-span-3 text-center py-12 text-gray-400">
              {hosts.length === 0
                ? 'No hay proveedores registrados con rol host ún.'
                : 'No se encontraron proveedores con estos filtros.'}
            </div>
          )}
        </div>
      )}

      {/* Detail modal */}
      {selectedHost && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{TYPE_ICONS[selectedHost.type]}</span>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{selectedHost.name}</h2>
                  <p className="text-sm text-gray-400">{selectedHost.email}</p>
                </div>
              </div>
              <button onClick={() => setSelectedHost(null)} className="text-gray-400 hover:text-gray-700 text-2xl">×</button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  ['Tipo',      TYPE_ICONS[selectedHost.type] + ' ' + selectedHost.type.charAt(0).toUpperCase() + selectedHost.type.slice(1)],
                  ['Estado',    STATUS_STYLE[selectedHost.status]?.label ?? selectedHost.status],
                  ['Email',     selectedHost.email],
                  ['­eléfono',  selectedHost.phone || '—'],
                  ['Ciudad',    selectedHost.city],
                  ['Servicios', selectedHost.servicesCount.toString()],
                  ['Reservas',  selectedHost.totalBookings?.toString() ?? 'N/D'],
                  ['Ingresos',  selectedHost.totalRevenue \!= null ? `$${selectedHost.totalRevenue}` : 'N/D'],
                  ['Pendiente', selectedHost.pendingPayout \!= null ? `$${selectedHost.pendingPayout}` : 'N/D'],
                  ['Desde',     selectedHost.joinedAt ? new Date(selectedHost.joinedAt).toLocaleDateString('es-EC') : '—'],
                ].map(([k, v]) => (
                  <div key={k}>
                    <p className="text-xs text-gray-400 mb-0.5">{k}</p>
                    <p className="text-sm font-semibold text-gray-900 break-all">{v}</p>
                  </div>
                ))}
              </div>

              {selectedHost.services.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Servicios publicados</p>
                  <div className="space-y-2">
                    {selectedHost.services.map(sv => (
                      <div key={sv.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{sv.title}</p>
                          {sv.location?.city && <p className="text-xs text-gray-400">{sv.location.city}</p>}
                        </div>
                        <div className="text-right">
                          {(sv.price ?? sv.pricePerNight) && (
                            <p className="text-sm font-bold text-gray-700">
                              ${(sv.price?.amount ?? sv.pricePerNight?.amount ?? 0).toFixed(2)}
                            </p>
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            sv.status === 'published' ? 'bg-green-100 text-green-700'
                            : sv.status === 'draft'   ? 'bg-gray-100 text-gray-500'
                            : 'bg-orange-100 text-orange-600'
                          }`}>{sv.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedHost.totalRevenue == null && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700">
                  💡 Los datos financieros estarán disponibles cuando el backend exponga <code>/admin/hosts/:id/stats</code>.
                </div>
              )}
            </div>

            <div className="p-6 pt-0 flex gap-3">
              {selectedHost.status === 'active' && (
                <button
                  disabled={actionLoading === selectedHost.id}
                  onClick={() => handleStatus(selectedHost.id, 'suspended')}
                  className="flex-1 py-2 text-sm font-bold bg-red-50 text-red-600 rounded-xl hover:bg-red-100 disabled:opacity-60"
                >
                  {actionLoading === selectedHost.id ? 'Procesando…' : 'Suspender'}
                </button>
              )}
              {(selectedHost.status === 'pending' || selectedHost.status === 'review') && (
                <button
                  disabled={actionLoading === selectedHost.id}
                  onClick={() => handleStatus(selectedHost.id, 'active')}
                  className="flex-1 py-2 text-sm font-bold text-white rounded-xl disabled:opacity-60"
                  style={{ backgroundColor: '#16a34a' }}
                >
                  {actionLoading === selectedHost.id ? 'Procesando…' : 'Aprobar proveedor'}
                </button>
              )}
              {selectedHost.status === 'suspended' && (
                <button
                  disabled={actionLoading === selectedHost.id}
                  onClick={() => handleStatus(selectedHost.id, 'active')}
                  className="flex-1 py-2 text-sm font-bold text-white rounded-xl disabled:opacity-60"
                  style={{ backgroundColor: '#0033A0' }}
                >
                  {actionLoading === selectedHost.id ? 'Procesando…' : 'Reactivar'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </AdminLayout>
  );
}
