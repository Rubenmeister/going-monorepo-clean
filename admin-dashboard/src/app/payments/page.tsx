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

function downloadCSV(rows: Payment[]) {
  const header = ['ID','Usuario','Email','Monto','Moneda','Método','Estado','Fecha'];
  const lines = rows.map(p => [
    p.id, p.userName ?? '', p.userEmail ?? '', p.amount ?? '', p.currency ?? '',
    p.method ?? '', p.status, p.createdAt?.slice(0,10) ?? '',
  ].map(v => `"${String(v).replace(/"/g,'""')}"`).join(','));
  const blob = new Blob(['\uFEFF' + [header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'pagos.csv'; a.click();
  URL.revokeObjectURL(url);
}

interface Payment {
  id: string;
  bookingId?: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  amount?: number;
  currency?: string;
  method?: string;
  status: string;
  createdAt?: string;
  paidAt?: string;
  refundedAt?: string;
  refundReason?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; tab: string }> = {
  paid:      { label: 'Cobrado',     color: 'bg-green-100 text-green-800',  tab: 'paid' },
  pending:   { label: 'Pendiente',   color: 'bg-yellow-100 text-yellow-800', tab: 'pending' },
  failed:    { label: 'Fallido',     color: 'bg-red-100 text-red-800',      tab: 'failed' },
  refunded:  { label: 'Reembolsado', color: 'bg-purple-100 text-purple-800', tab: 'refunded' },
  cancelled: { label: 'Cancelado',   color: 'bg-gray-100 text-gray-600',    tab: 'failed' },
};

const TABS = [
  { key: '',         label: 'Todos' },
  { key: 'paid',     label: 'Cobrados' },
  { key: 'pending',  label: 'Pendientes' },
  { key: 'failed',   label: 'Fallidos' },
  { key: 'refunded', label: 'Reembolsados' },
];

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_CONFIG[status] ?? { label: status, color: 'bg-gray-100 text-gray-700' };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${s.color}`}>{s.label}</span>;
}

function fmt(amount?: number, currency?: string) {
  if (amount == null) return '—';
  return `${currency ?? 'PEN'} ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
}

function PaymentDetail({ payment, token, onClose, onUpdate }: {
  payment: Payment; token: string; onClose: () => void;
  onUpdate: (p: Payment) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [showRefund, setShowRefund] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [toast, setToast] = useState('');

  const notify = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  async function refund() {
    if (!refundReason.trim()) return;
    setLoading(true);
    try {
      await adminFetch(token, `/payments/${payment.id}/refund`, {
        method: 'POST', body: JSON.stringify({ reason: refundReason }),
      });
      onUpdate({ ...payment, status: 'refunded', refundReason, refundedAt: new Date().toISOString() });
      notify('Reembolso procesado');
      setShowRefund(false);
    } catch { notify('Error al procesar reembolso'); }
    finally { setLoading(false); }
  }

  const field = (label: string, value?: string | number) => value != null ? (
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
            <h2 className="text-lg font-bold text-gray-900">Pago #{payment.id.slice(-8)}</h2>
            <StatusBadge status={payment.status} />
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>

        {/* Amount hero */}
        <div className="px-6 py-8 text-center" style={{ backgroundColor: '#011627' }}>
          <p className="text-sm text-white/50 mb-1">Monto</p>
          <p className="text-4xl font-black text-white">{fmt(payment.amount, payment.currency)}</p>
          {payment.method && (
            <p className="text-sm text-white/60 mt-2 capitalize">{payment.method}</p>
          )}
        </div>

        <div className="p-6 space-y-6 flex-1">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Usuario</p>
            <div className="grid grid-cols-2 gap-3">
              {field('Nombre', payment.userName)}
              {field('Email', payment.userEmail)}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Detalles</p>
            <div className="grid grid-cols-2 gap-3">
              {field('Reserva', payment.bookingId?.slice(-8))}
              {field('Descripción', payment.description)}
              {field('Creado', payment.createdAt?.replace('T',' ').slice(0,16))}
              {field('Pagado', payment.paidAt?.replace('T',' ').slice(0,16))}
              {field('Reembolsado', payment.refundedAt?.replace('T',' ').slice(0,16))}
            </div>
          </div>

          {payment.refundReason && (
            <div className="bg-purple-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-purple-600 mb-1">Motivo Reembolso</p>
              <p className="text-sm text-purple-800">{payment.refundReason}</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t space-y-3">
          {payment.status === 'paid' && !showRefund && (
            <button
              onClick={() => setShowRefund(true)}
              className="w-full py-2.5 rounded-xl border border-purple-300 text-purple-600 text-sm font-semibold hover:bg-purple-50"
            >
              Procesar Reembolso
            </button>
          )}
          {showRefund && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Motivo del reembolso</p>
              <textarea
                value={refundReason} onChange={e => setRefundReason(e.target.value)}
                placeholder="Ingresa el motivo…"
                rows={3}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
              <div className="flex gap-2">
                <button
                  onClick={refund} disabled={loading || !refundReason.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-semibold disabled:opacity-50"
                >
                  {loading ? 'Procesando…' : 'Confirmar Reembolso'}
                </button>
                <button onClick={() => setShowRefund(false)} className="px-4 py-2.5 rounded-xl border text-sm text-gray-600 hover:bg-gray-50">
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

export default function PaymentsPage() {
  const { auth } = useMonorepoApp();
  const token: string = typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? '' : '';

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Payment | null>(null);
  const [activeTab, setActiveTab] = useState('');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await adminFetch<{ data?: Payment[]; items?: Payment[] } | Payment[]>(token, '/payments?limit=200');
      const list = Array.isArray(res) ? res : (res.data ?? res.items ?? []);
      setPayments(list.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')));
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error'); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const filtered = payments.filter(p => {
    const q = search.toLowerCase();
    const matchQ = !q || (p.userName ?? '').toLowerCase().includes(q) || (p.userEmail ?? '').toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
    const matchTab = !activeTab || STATUS_CONFIG[p.status]?.tab === activeTab || p.status === activeTab;
    return matchQ && matchTab;
  });

  const kpis = {
    cobrado:   payments.filter(p => p.status === 'paid').reduce((s, p) => s + (p.amount ?? 0), 0),
    pendiente: payments.filter(p => p.status === 'pending').reduce((s, p) => s + (p.amount ?? 0), 0),
    fallido:   payments.filter(p => p.status === 'failed' || p.status === 'cancelled').reduce((s, p) => s + (p.amount ?? 0), 0),
    reembolsado: payments.filter(p => p.status === 'refunded').reduce((s, p) => s + (p.amount ?? 0), 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pagos</h1>
          <p className="text-sm text-gray-500 mt-1">Historial y gestión de transacciones</p>
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

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Cobrado',     value: kpis.cobrado,     color: 'text-green-600' },
          { label: 'Por Cobrar',        value: kpis.pendiente,   color: 'text-yellow-600' },
          { label: 'Fallidos',          value: kpis.fallido,     color: 'text-red-600' },
          { label: 'Reembolsado',       value: kpis.reembolsado, color: 'text-purple-600' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500 font-medium">{k.label}</p>
            <p className={`text-xl font-bold mt-1 ${k.color}`}>
              PEN {k.value.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </p>
          </div>
        ))}
      </div>

      {/* Tabs + search */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-1 px-4 pt-4 border-b border-gray-100">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === t.key ? 'text-red-600 border-b-2 border-red-500' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
              <span className="ml-1.5 text-xs text-gray-400">
                ({payments.filter(p => !t.key || STATUS_CONFIG[p.status]?.tab === t.key || p.status === t.key).length})
              </span>
            </button>
          ))}
          <div className="ml-auto pb-2">
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar…"
              className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 w-52"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400">Cargando pagos…</div>
        ) : error ? (
          <div className="p-12 text-center text-red-500">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No hay pagos con esos filtros</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['ID','Usuario','Método','Monto','Estado','Fecha',''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelected(p)}>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">#{p.id.slice(-8)}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{p.userName ?? '—'}</p>
                    <p className="text-xs text-gray-400">{p.userEmail}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600 capitalize">{p.method ?? '—'}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{fmt(p.amount, p.currency)}</td>
                  <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                  <td className="px-4 py-3 text-gray-500">{p.createdAt?.slice(0,10) ?? '—'}</td>
                  <td className="px-4 py-3">
                    <button className="text-gray-400 hover:text-gray-700">›</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400 text-right">
          {filtered.length} transacciones
        </div>
      </div>

      {selected && (
        <PaymentDetail
          payment={selected} token={token} onClose={() => setSelected(null)}
          onUpdate={updated => {
            setPayments(prev => prev.map(p => p.id === updated.id ? updated : p));
            setSelected(updated);
          }}
        />
      )}
    </div>
  );
}
