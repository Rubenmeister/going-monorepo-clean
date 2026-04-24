'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';

const API = 'https://api-gateway-780842550857.us-central1.run.app';

async function adminFetch<T>(token: string, path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(opts?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

interface Vehicle {
  id: string;
  driverId?: string;
  driverName?: string;
  driverEmail?: string;
  driverPhone?: string;
  plate?: string;
  brand?: string;
  model?: string;
  year?: number;
  color?: string;
  type?: string;
  capacity?: number;
  status?: string;
  approved?: boolean;
  soatExpiry?: string;
  soatUrl?: string;
  matriculaExpiry?: string;
  matriculaUrl?: string;
  technicalExpiry?: string;
  photoUrl?: string;
  createdAt?: string;
}

type DocState = 'ok' | 'expiring' | 'expired' | 'missing';

function getDocState(expiry?: string): DocState {
  if (!expiry) return 'missing';
  const diff = (new Date(expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (diff < 0) return 'expired';
  if (diff < 30) return 'expiring';
  return 'ok';
}

const DOC_STATE_STYLES: Record<DocState, string> = {
  ok:       'bg-green-100 text-green-700',
  expiring: 'bg-yellow-100 text-yellow-700',
  expired:  'bg-red-100 text-red-700',
  missing:  'bg-gray-100 text-gray-500',
};
const DOC_STATE_LABELS: Record<DocState, string> = {
  ok: 'Vigente', expiring: 'Por vencer', expired: 'Vencido', missing: 'Sin doc.',
};

function DocBadge({ label, expiry }: { label: string; expiry?: string }) {
  const state = getDocState(expiry);
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${DOC_STATE_STYLES[state]}`}>
      {label}: {expiry ? expiry.slice(0, 10) : DOC_STATE_LABELS[state]}
    </span>
  );
}

const STATUS_STYLES: Record<string, string> = {
  active:    'bg-green-100 text-green-800',
  inactive:  'bg-gray-100 text-gray-600',
  suspended: 'bg-red-100 text-red-700',
  pending:   'bg-yellow-100 text-yellow-800',
};

function VehicleDetail({ vehicle, token, onClose, onUpdate }: {
  vehicle: Vehicle; token: string; onClose: () => void;
  onUpdate: (v: Vehicle) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');

  const notify = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  async function approve() {
    setLoading(true);
    try {
      await adminFetch(token, `/auth/admin/users/${vehicle.driverId}/status`, {
        method: 'PATCH', body: JSON.stringify({ vehicleApproved: true, status: 'active' }),
      });
      onUpdate({ ...vehicle, approved: true, status: 'active' });
      notify('Vehículo aprobado');
    } catch { notify('Error al aprobar'); }
    finally { setLoading(false); }
  }

  async function suspend() {
    setLoading(true);
    try {
      await adminFetch(token, `/auth/admin/users/${vehicle.driverId}/status`, {
        method: 'PATCH', body: JSON.stringify({ status: 'suspended' }),
      });
      onUpdate({ ...vehicle, status: 'suspended' });
      notify('Vehículo suspendido');
    } catch { notify('Error al suspender'); }
    finally { setLoading(false); }
  }

  async function reactivate() {
    setLoading(true);
    try {
      await adminFetch(token, `/auth/admin/users/${vehicle.driverId}/status`, {
        method: 'PATCH', body: JSON.stringify({ status: 'active' }),
      });
      onUpdate({ ...vehicle, status: 'active' });
      notify('Vehículo reactivado');
    } catch { notify('Error al reactivar'); }
    finally { setLoading(false); }
  }

  const field = (label: string, value?: string | number) => value != null ? (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-medium text-gray-900">{value}</p>
    </div>
  ) : null;

  const soatState = getDocState(vehicle.soatExpiry);
  const matriculaState = getDocState(vehicle.matriculaExpiry);
  const technicalState = getDocState(vehicle.technicalExpiry);

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-[500px] bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
        {toast && (
          <div className="fixed top-4 right-4 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg shadow z-50">{toast}</div>
        )}

        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{vehicle.brand} {vehicle.model}</h2>
            <p className="text-sm text-gray-500">{vehicle.plate} · {vehicle.year}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>

        {vehicle.photoUrl && (
          <div className="h-48 bg-gray-100 overflow-hidden">
            <img src={vehicle.photoUrl} alt="Vehículo" className="w-full h-full object-cover" />
          </div>
        )}

        <div className="p-6 space-y-6 flex-1">
          {/* Status badges */}
          <div className="flex flex-wrap gap-2">
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[vehicle.status ?? ''] ?? 'bg-gray-100 text-gray-600'}`}>
              {vehicle.status ?? 'desconocido'}
            </span>
            {vehicle.approved && (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">✓ Aprobado</span>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Conductor</p>
            <div className="grid grid-cols-2 gap-3">
              {field('Nombre', vehicle.driverName)}
              {field('Email', vehicle.driverEmail)}
              {field('Teléfono', vehicle.driverPhone)}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Vehículo</p>
            <div className="grid grid-cols-3 gap-3">
              {field('Marca', vehicle.brand)}
              {field('Modelo', vehicle.model)}
              {field('Año', vehicle.year)}
              {field('Color', vehicle.color)}
              {field('Tipo', vehicle.type)}
              {field('Capacidad', vehicle.capacity ? `${vehicle.capacity} pas.` : undefined)}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Documentación</p>
            <div className="space-y-3">
              <div className={`rounded-xl p-4 ${soatState === 'ok' ? 'bg-green-50' : soatState === 'expiring' ? 'bg-yellow-50' : 'bg-red-50'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-600">SOAT</p>
                    <p className="text-sm text-gray-800">{vehicle.soatExpiry ? `Vence: ${vehicle.soatExpiry.slice(0,10)}` : 'Sin documento'}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg ${DOC_STATE_STYLES[soatState]}`}>
                    {DOC_STATE_LABELS[soatState]}
                  </span>
                </div>
                {vehicle.soatUrl && (
                  <a href={vehicle.soatUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline mt-1 block">
                    Ver documento →
                  </a>
                )}
              </div>

              <div className={`rounded-xl p-4 ${matriculaState === 'ok' ? 'bg-green-50' : matriculaState === 'expiring' ? 'bg-yellow-50' : 'bg-red-50'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-600">Matrícula</p>
                    <p className="text-sm text-gray-800">{vehicle.matriculaExpiry ? `Vence: ${vehicle.matriculaExpiry.slice(0,10)}` : 'Sin documento'}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg ${DOC_STATE_STYLES[matriculaState]}`}>
                    {DOC_STATE_LABELS[matriculaState]}
                  </span>
                </div>
                {vehicle.matriculaUrl && (
                  <a href={vehicle.matriculaUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline mt-1 block">
                    Ver documento →
                  </a>
                )}
              </div>

              {vehicle.technicalExpiry && (
                <div className={`rounded-xl p-4 ${technicalState === 'ok' ? 'bg-green-50' : technicalState === 'expiring' ? 'bg-yellow-50' : 'bg-red-50'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-gray-600">Revisión Técnica</p>
                      <p className="text-sm text-gray-800">Vence: {vehicle.technicalExpiry.slice(0,10)}</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${DOC_STATE_STYLES[technicalState]}`}>
                      {DOC_STATE_LABELS[technicalState]}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t space-y-3">
          {!vehicle.approved && (
            <button
              onClick={approve} disabled={loading}
              className="w-full py-2.5 rounded-xl text-white text-sm font-semibold transition-opacity disabled:opacity-50"
              style={{ backgroundColor: '#ff4c41' }}
            >
              {loading ? 'Aprobando…' : '✓ Aprobar Vehículo'}
            </button>
          )}
          {vehicle.status !== 'suspended' && vehicle.approved && (
            <button
              onClick={suspend} disabled={loading}
              className="w-full py-2.5 rounded-xl border border-red-300 text-red-600 text-sm font-semibold hover:bg-red-50 disabled:opacity-50"
            >
              Suspender
            </button>
          )}
          {vehicle.status === 'suspended' && (
            <button
              onClick={reactivate} disabled={loading}
              className="w-full py-2.5 rounded-xl border border-green-400 text-green-700 text-sm font-semibold hover:bg-green-50 disabled:opacity-50"
            >
              Reactivar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VehiclesPage() {
  const { auth } = useMonorepoApp();
  const token: string = typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? '' : '';

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Vehicle | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDoc, setFilterDoc] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await adminFetch<{ data?: Vehicle[]; items?: Vehicle[] } | Vehicle[]>(token, '/vehicles?limit=200');
      const list = Array.isArray(res) ? res : (res.data ?? res.items ?? []);
      setVehicles(list);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error'); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const filtered = vehicles.filter(v => {
    const q = search.toLowerCase();
    const matchQ = !q || (v.plate ?? '').toLowerCase().includes(q) || (v.driverName ?? '').toLowerCase().includes(q) || (v.brand ?? '').toLowerCase().includes(q);
    const matchS = !filterStatus || v.status === filterStatus;
    const matchDoc = !filterDoc || (
      filterDoc === 'expired' && (getDocState(v.soatExpiry) === 'expired' || getDocState(v.matriculaExpiry) === 'expired') ||
      filterDoc === 'expiring' && (getDocState(v.soatExpiry) === 'expiring' || getDocState(v.matriculaExpiry) === 'expiring') ||
      filterDoc === 'missing' && (getDocState(v.soatExpiry) === 'missing' || getDocState(v.matriculaExpiry) === 'missing')
    );
    return matchQ && matchS && matchDoc;
  });

  const expiredDocs = vehicles.filter(v => getDocState(v.soatExpiry) === 'expired' || getDocState(v.matriculaExpiry) === 'expired');
  const pendingApproval = vehicles.filter(v => !v.approved);

  const stats = {
    total: vehicles.length,
    active: vehicles.filter(v => v.status === 'active').length,
    pending: pendingApproval.length,
    suspended: vehicles.filter(v => v.status === 'suspended').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vehículos</h1>
          <p className="text-sm text-gray-500 mt-1">Flota registrada y estado documental</p>
        </div>
        <button onClick={load} className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
          ↺ Actualizar
        </button>
      </div>

      {/* Alert banners */}
      {expiredDocs.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 flex items-center gap-3">
          <span className="text-red-500 text-xl">⚠</span>
          <div>
            <p className="text-sm font-semibold text-red-800">{expiredDocs.length} vehículo(s) con documentos vencidos</p>
            <p className="text-xs text-red-600">Revisa SOAT y matrícula. Filtra por "Vencido" para verlos.</p>
          </div>
          <button onClick={() => setFilterDoc('expired')} className="ml-auto text-xs text-red-700 underline">Ver</button>
        </div>
      )}
      {pendingApproval.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl px-5 py-4 flex items-center gap-3">
          <span className="text-yellow-500 text-xl">🕐</span>
          <div>
            <p className="text-sm font-semibold text-yellow-800">{pendingApproval.length} vehículo(s) pendientes de aprobación</p>
            <p className="text-xs text-yellow-700">Haz click en un vehículo para revisar y aprobar.</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'text-gray-900' },
          { label: 'Activos', value: stats.active, color: 'text-green-600' },
          { label: 'Pendientes', value: stats.pending, color: 'text-yellow-600' },
          { label: 'Suspendidos', value: stats.suspended, color: 'text-red-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500 font-medium">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex gap-3 flex-wrap">
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por placa, conductor o marca…"
          className="flex-1 min-w-[220px] border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
        />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none">
          <option value="">Todos los estados</option>
          <option value="active">Activo</option>
          <option value="inactive">Inactivo</option>
          <option value="suspended">Suspendido</option>
          <option value="pending">Pendiente</option>
        </select>
        <select value={filterDoc} onChange={e => setFilterDoc(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none">
          <option value="">Todos los docs</option>
          <option value="expired">Vencidos</option>
          <option value="expiring">Por vencer</option>
          <option value="missing">Sin documento</option>
        </select>
        {(search || filterStatus || filterDoc) && (
          <button onClick={() => { setSearch(''); setFilterStatus(''); setFilterDoc(''); }}
            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700">✕ Limpiar</button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Cargando vehículos…</div>
        ) : error ? (
          <div className="p-12 text-center text-red-500">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No hay vehículos con esos filtros</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Placa','Vehículo','Conductor','Estado','SOAT','Matrícula','Aprobado',''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(v => (
                <tr key={v.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelected(v)}>
                  <td className="px-4 py-3 font-mono font-bold text-gray-900">{v.plate ?? '—'}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{v.brand} {v.model}</p>
                    <p className="text-xs text-gray-400">{v.year} · {v.color}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{v.driverName ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[v.status ?? ''] ?? 'bg-gray-100 text-gray-600'}`}>
                      {v.status ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3"><DocBadge label="SOAT" expiry={v.soatExpiry} /></td>
                  <td className="px-4 py-3"><DocBadge label="Mat." expiry={v.matriculaExpiry} /></td>
                  <td className="px-4 py-3">
                    {v.approved
                      ? <span className="text-green-600 font-semibold text-xs">✓ Sí</span>
                      : <span className="text-yellow-600 font-semibold text-xs">⏳ No</span>}
                  </td>
                  <td className="px-4 py-3">
                    <button className="text-gray-400 hover:text-gray-700">›</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="text-xs text-gray-400 text-right">{filtered.length} vehículos</p>

      {selected && (
        <VehicleDetail
          vehicle={selected} token={token} onClose={() => setSelected(null)}
          onUpdate={updated => {
            setVehicles(prev => prev.map(v => v.id === updated.id ? updated : v));
            setSelected(updated);
          }}
        />
      )}
    </div>
  );
}
