'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.goingec.com';

async function adminFetch<T>(token: string, path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(opts?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

function downloadCSV(rows: Booking[]) {
  const header = ['ID','Usuario','Email','Servicio','Tipo','Estado','Fecha','Monto'];
  const lines = rows.map(b => [
    b.id, b.userName ?? '', b.userEmail ?? '', b.serviceType ?? '', b.vehicleType ?? '',
    b.status, b.createdAt?.slice(0,10) ?? '', b.totalAmount ?? '',
  ].map(v => `"${String(v).replace(/"/g,'""')}"`).join(','));
  const blob = new Blob(['\uFEFF' + [header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'reservas.csv'; a.click();
  URL.revokeObjectURL(url);
}

interface Booking {
  id: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  driverId?: string;
  driverName?: string;
  status: string;
  serviceType?: string;
  vehicleType?: string;
  origin?: string;
  destination?: string;
  totalAmount?: number;
  currency?: string;
  createdAt?: string;
  scheduledAt?: string;
  completedAt?: string;
  cancelReason?: string;
  notes?: string;
  companyId?: string;
  companyName?: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:    { label: 'Pendiente',   color: 'bg-yellow-100 text-yellow-800' },
  confirmed:  { label: 'Confirmada',  color: 'bg-blue-100 text-blue-800' },
  in_progress:{ label: 'En Curso',    color: 'bg-indigo-100 text-indigo-800' },
  completed:  { label: 'Completada',  color: 'bg-green-100 text-green-800' },
  cancelled:  { label: 'Cancelada',   color: 'bg-red-100 text-red-800' },
};

const SERVICE_TYPES = ['traslado', 'aeropuerto', 'corporativo', 'evento', 'diario'];

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_LABELS[status] ?? { label: status, color: 'bg-gray-100 text-gray-700' };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${s.color}`}>{s.label}</span>;
}

function BookingDetail({ booking, token, onClose, onUpdate }: {
  booking: Booking; token: string; onClose: () => void;
  onUpdate: (b: Booking) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancel, setShowCancel] = useState(false);
  const [toast, setToast] = useState('');

  const notify = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  async function confirm() {
    setLoading(true);
    try {
      await adminFetch(token, `/bookings/${booking.id}/confirm`, { method: 'PATCH' });
      onUpdate({ ...booking, status: 'confirmed' });
      notify('Reserva confirmada');
    } catch { notify('Error al confirmar'); }
    finally { setLoading(false); }
  }

  async function cancel() {
    if (!cancelReason.trim()) return;
    setLoading(true);
    try {
      await adminFetch(token, `/bookings/${booking.id}/cancel`, {
        method: 'PATCH', body: JSON.stringify({ reason: cancelReason }),
      });
      onUpdate({ ...booking, status: 'cancelled', cancelReason });
      notify('Reserva cancelada');
      setShowCancel(false);
    } catch { notify('Error al cancelar'); }
    finally { setLoading(false); }
  }

  const field = (label: string, value?: string | number) => value ? (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-medium text-gray-900">{value}</p>
    </div>
  ) : null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-[480px] bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
        {toast && (
          <div className="fixed top-4 right-4 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg shadow z-50">{toast}</div>
        )}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Reserva #{booking.id.slice(-8)}</h2>
            <StatusBadge status={booking.status} />
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>

        <div className="p-6 space-y-6 flex-1">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Usuario</p>
            <div className="grid grid-cols-2 gap-3">
              {field('Nombre', booking.userName)}
              {field('Email', booking.userEmail)}
              {field('Empresa', booking.companyName)}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Servicio</p>
            <div className="grid grid-cols-2 gap-3">
              {field('Tipo Servicio', booking.serviceType)}
              {field('Tipo Vehículo', booking.vehicleType)}
              {field('Conductor', booking.driverName)}
              {field('Monto', booking.totalAmount ? `${booking.currency ?? 'PEN'} ${booking.totalAmount}` : undefined)}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Ruta</p>
            <div className="space-y-2">
              {booking.origin && (
                <div className="flex gap-2">
                  <span className="text-green-500 mt-0.5">●</span>
                  <p className="text-sm text-gray-700">{booking.origin}</p>
                </div>
              )}
              {booking.destination && (
                <div className="flex gap-2">
                  <span className="text-red-500 mt-0.5">●</span>
                  <p className="text-sm text-gray-700">{booking.destination}</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Fechas</p>
            <div className="grid grid-cols-2 gap-3">
              {field('Creada', booking.createdAt?.replace('T',' ').slice(0,16))}
              {field('Programada', booking.scheduledAt?.replace('T',' ').slice(0,16))}
              {field('Completada', booking.completedAt?.replace('T',' ').slice(0,16))}
            </div>
          </div>

          {booking.cancelReason && (
            <div className="bg-red-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-red-600 mb-1">Motivo Cancelación</p>
              <p className="text-sm text-red-700">{booking.cancelReason}</p>
            </div>
          )}

          {booking.notes && (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 mb-1">Notas</p>
              <p className="text-sm text-gray-700">{booking.notes}</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t space-y-3">
          {booking.status === 'pending' && !showCancel && (
            <div className="flex gap-3">
              <button
                onClick={confirm} disabled={loading}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-opacity disabled:opacity-50"
                style={{ backgroundColor: '#ff4c41' }}
              >
                {loading ? 'Confirmando…' : 'Confirmar Reserva'}
              </button>
              <button
                onClick={() => setShowCancel(true)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          )}
          {(booking.status === 'confirmed' || booking.status === 'in_progress') && !showCancel && (
            <button
              onClick={() => setShowCancel(true)}
              className="w-full py-2.5 rounded-xl border border-red-300 text-red-600 text-sm font-semibold hover:bg-red-50"
            >
              Cancelar Reserva
            </button>
          )}
          {showCancel && (
            <div className="space-y-3">
              <textarea
                value={cancelReason} onChange={e => setCancelReason(e.target.value)}
                placeholder="Motivo de cancelación…"
                rows={3}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
              />
              <div className="flex gap-2">
                <button
                  onClick={cancel} disabled={loading || !cancelReason.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold disabled:opacity-50"
                >
                  {loading ? 'Cancelando…' : 'Confirmar Cancelación'}
                </button>
                <button onClick={() => setShowCancel(false)} className="px-4 py-2.5 rounded-xl border text-sm text-gray-600 hover:bg-gray-50">
                  Atrás
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BookingsPage() {
  const { auth } = useMonorepoApp();
  const token: string = typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? '' : '';

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Booking | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      // Endpoint admin real: lista global de reservas. Antes se pegaba a
      // /transport/pending (inexistente) y a /bookings sin companyId (el
      // backend lo rechaza con 400). Ahora GET /bookings/admin lista todas.
      const all = await adminFetch<{ data?: Booking[]; items?: Booking[] } | Booking[]>(token, '/bookings/admin?limit=200');
      const allList = Array.isArray(all) ? all : (all?.data ?? all?.items ?? []);
      setBookings([...allList].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')));
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error'); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const filtered = bookings.filter(b => {
    const q = search.toLowerCase();
    const matchQ = !q || (b.userName ?? '').toLowerCase().includes(q) || (b.userEmail ?? '').toLowerCase().includes(q) || b.id.toLowerCase().includes(q);
    const matchS = !filterStatus || b.status === filterStatus;
    const matchT = !filterType || b.serviceType === filterType;
    return matchQ && matchS && matchT;
  });

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    in_progress: bookings.filter(b => b.status === 'in_progress').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    revenue: bookings.filter(b => b.status === 'completed').reduce((s, b) => s + (b.totalAmount ?? 0), 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reservas</h1>
          <p className="text-sm text-gray-500 mt-1">Gestión de todas las reservas de la plataforma</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => downloadCSV(filtered)} className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
            ⬇ Exportar CSV
          </button>
          <button onClick={load} className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
            ↺ Actualizar
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'text-gray-900' },
          { label: 'Pendientes', value: stats.pending, color: 'text-yellow-600' },
          { label: 'En Curso', value: stats.in_progress, color: 'text-indigo-600' },
          { label: 'Completadas', value: stats.completed, color: 'text-green-600' },
          { label: 'Ingresos', value: `PEN ${stats.revenue.toLocaleString()}`, color: 'text-gray-900' },
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
          placeholder="Buscar por nombre, email o ID…"
          className="flex-1 min-w-[220px] border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
        />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none">
          <option value="">Todos los estados</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none">
          <option value="">Todos los tipos</option>
          {SERVICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        {(search || filterStatus || filterType) && (
          <button onClick={() => { setSearch(''); setFilterStatus(''); setFilterType(''); }}
            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700">✕ Limpiar</button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Cargando reservas…</div>
        ) : error ? (
          <div className="p-12 text-center text-red-500">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No hay reservas con esos filtros</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['ID','Usuario','Servicio','Tipo','Estado','Fecha','Monto',''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(b => (
                <tr key={b.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelected(b)}>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">#{b.id.slice(-8)}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{b.userName ?? '—'}</p>
                    <p className="text-xs text-gray-400">{b.userEmail}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{b.serviceType ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{b.vehicleType ?? '—'}</td>
                  <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                  <td className="px-4 py-3 text-gray-500">{b.createdAt?.slice(0,10) ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-900 font-medium">
                    {b.totalAmount ? `${b.currency ?? 'PEN'} ${b.totalAmount}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <button className="text-gray-400 hover:text-gray-700" onClick={e => { e.stopPropagation(); setSelected(b); }}>›</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="text-xs text-gray-400 text-right">{filtered.length} reservas</p>

      {selected && (
        <BookingDetail
          booking={selected} token={token} onClose={() => setSelected(null)}
          onUpdate={updated => {
            setBookings(prev => prev.map(b => b.id === updated.id ? updated : b));
            setSelected(updated);
          }}
        />
      )}
    </div>
  );
}
