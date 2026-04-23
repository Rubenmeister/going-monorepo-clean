'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';
import { AdminLayout } from '../components';
import { Loading } from '@going-monorepo-clean/shared-ui';
import { API } from '../../lib/admin-api';

async function req<T>(token: string, path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...opts, headers: { 'Content-Type':'application/json', Authorization:`Bearer ${token}`, ...(opts?.headers??{}) },
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

interface Payout {
  id: string; providerId: string; providerName: string;
  providerType: 'driver' | 'host' | 'guide' | 'courier';
  amount: number; currency?: string;
  status: 'pending' | 'paid' | 'failed';
  periodStart?: string; periodEnd?: string;
  paidAt?: string; method?: string;
  tripCount?: number; createdAt?: string;
}

const TYPE_ICONS: Record<string, string> = { driver:'🚗', host:'🏨', guide:'🗺️', courier:'📦' };
const TYPE_LABELS: Record<string, string> = { driver:'Conductor', host:'Anfitrión', guide:'Guía', courier:'Mensajero' };

function fmt(v: number, cur = 'PEN') {
  return `${cur} ${v.toLocaleString('es-PE', { minimumFractionDigits:2 })}`;
}

function downloadCSV(rows: Payout[]) {
  const h = ['ID','Proveedor','Tipo','Monto','Estado','Período','Pagado'];
  const lines = rows.map(p => [p.id,p.providerName,p.providerType,p.amount,p.status,
    `${p.periodStart?.slice(0,10)??''} - ${p.periodEnd?.slice(0,10)??''}`, p.paidAt?.slice(0,10)??''
  ].map(v=>`"${String(v).replace(/"/g,'""')}"`).join(','));
  const blob = new Blob(['\uFEFF'+[h.join(','),...lines].join('\n')],{type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download='liquidaciones.csv'; a.click();
  URL.revokeObjectURL(url);
}

export default function PayoutsPage() {
  const { auth } = useMonorepoApp();
  const token: string = typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? '' : '';

  const [payouts,  setPayouts]  = useState<Payout[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [toast,    setToast]    = useState<{msg:string;ok:boolean}|null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType,   setFilterType]   = useState('');
  const [search,       setSearch]       = useState('');
  const [selected,     setSelected]     = useState<Set<string>>(new Set());
  const [bulkPaying,   setBulkPaying]   = useState(false);

  const notify = (msg: string, ok = true) => { setToast({msg,ok}); setTimeout(() => setToast(null), 3500); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await req<any>(token, '/payouts?limit=200');
      setPayouts(Array.isArray(res) ? res : res?.data ?? res?.items ?? []);
    } catch { setPayouts([]); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function markPaid(ids: string[]) {
    setBulkPaying(true);
    let ok = 0;
    for (const id of ids) {
      try {
        await req(token, `/payouts/${id}/mark-paid`, { method:'PATCH' });
        setPayouts(p => p.map(pay => pay.id === id ? { ...pay, status:'paid', paidAt:new Date().toISOString() } : pay));
        ok++;
      } catch { /* skip */ }
    }
    setSelected(new Set());
    setBulkPaying(false);
    notify(`${ok}/${ids.length} liquidación${ok>1?'es':''} marcada${ok>1?'s':''} como pagada${ok>1?'s':''}`);
  }

  const filtered = payouts.filter(p => {
    const q = search.toLowerCase();
    return (!q || p.providerName.toLowerCase().includes(q)) &&
           (!filterStatus || p.status === filterStatus) &&
           (!filterType   || p.providerType === filterType);
  });

  const pending   = payouts.filter(p => p.status === 'pending');
  const totalPend = pending.reduce((s,p) => s+p.amount, 0);
  const totalPaid = payouts.filter(p=>p.status==='paid').reduce((s,p)=>s+p.amount, 0);

  const allVisible = filtered.map(p=>p.id);
  const allSelected = allVisible.length > 0 && allVisible.every(id => selected.has(id));
  const toggleAll  = () => setSelected(prev => allSelected ? new Set() : new Set(allVisible));
  const toggleOne  = (id: string) => setSelected(prev => { const n=new Set(prev); n.has(id)?n.delete(id):n.add(id); return n; });

  if (auth.isLoading || loading) return <Loading fullHeight size="lg" message="Cargando liquidaciones…" />;

  return (
    <AdminLayout userName={auth.user?.firstName ?? 'Admin'} onLogout={auth.logout}>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow text-sm font-medium text-white ${toast.ok?'bg-green-600':'bg-red-600'}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pagos a Proveedores</h1>
          <p className="text-sm text-gray-500 mt-1">Liquidaciones a conductores, anfitriones, guías y mensajeros</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => downloadCSV(filtered)}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
            ⬇ Exportar
          </button>
          <button onClick={load}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
            ↺ Actualizar
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs text-gray-500">Por pagar</p>
          <p className="text-2xl font-black text-amber-600 mt-1">{fmt(totalPend)}</p>
          <p className="text-xs text-gray-400 mt-1">{pending.length} pendiente{pending.length!==1?'s':''}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs text-gray-500">Pagado total</p>
          <p className="text-2xl font-black text-green-600 mt-1">{fmt(totalPaid)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs text-gray-500">Proveedores</p>
          <p className="text-2xl font-black text-gray-900 mt-1">{new Set(payouts.map(p=>p.providerId)).size}</p>
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="mb-4 flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-2xl">
          <span className="text-sm font-semibold text-blue-800">{selected.size} seleccionado{selected.size>1?'s':''}</span>
          <button onClick={() => markPaid([...selected])} disabled={bulkPaying}
            className="px-4 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 disabled:opacity-50">
            {bulkPaying ? 'Procesando…' : '✓ Marcar como pagados'}
          </button>
          <span className="text-xs text-blue-600 font-semibold ml-1">
            Total: {fmt([...selected].reduce((s,id)=>s+(payouts.find(p=>p.id===id)?.amount??0),0))}
          </span>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-xs text-blue-400 hover:underline">Limpiar</button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-5 shadow-sm flex gap-3 flex-wrap">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar proveedor…"
          className="flex-1 min-w-[180px] border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm">
          <option value="">Todos los estados</option>
          <option value="pending">Pendiente</option>
          <option value="paid">Pagado</option>
          <option value="failed">Fallido</option>
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm">
          <option value="">Todos los tipos</option>
          {Object.entries(TYPE_LABELS).map(([k,v]) => <option key={k} value={k}>{TYPE_ICONS[k]} {v}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-16 text-center text-gray-400">
            <p className="text-4xl mb-3">💸</p>
            <p className="font-semibold">Sin liquidaciones</p>
            <p className="text-sm mt-1">No hay pagos que coincidan con los filtros</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3"><input type="checkbox" checked={allSelected} onChange={toggleAll} className="w-4 h-4 accent-red-500" /></th>
                {['Proveedor','Tipo','Monto','Viajes','Período','Estado',''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(p => (
                <tr key={p.id} className={`hover:bg-gray-50 ${selected.has(p.id)?'bg-blue-50':''}`}>
                  <td className="px-4 py-3">
                    {p.status === 'pending' && (
                      <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleOne(p.id)}
                        className="w-4 h-4 accent-red-500 cursor-pointer" />
                    )}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{p.providerName}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {TYPE_ICONS[p.providerType]} {TYPE_LABELS[p.providerType]}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-gray-900">{fmt(p.amount, p.currency)}</td>
                  <td className="px-4 py-3 text-gray-500">{p.tripCount ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {p.periodStart?.slice(0,10)} – {p.periodEnd?.slice(0,10) ?? ''}
                  </td>
                  <td className="px-4 py-3">
                    {p.status === 'paid'
                      ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">✓ Pagado</span>
                      : p.status === 'failed'
                      ? <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">✕ Fallido</span>
                      : <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">⏳ Pendiente</span>}
                  </td>
                  <td className="px-4 py-3">
                    {p.status === 'pending' && (
                      <button onClick={() => markPaid([p.id])} disabled={bulkPaying}
                        className="text-xs text-green-600 hover:underline font-semibold">
                        Pagar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400 text-right">
          {filtered.length} liquidaciones · Pendiente: <span className="text-amber-600 font-semibold">{fmt(totalPend)}</span>
        </div>
      </div>
    </AdminLayout>
  );
}
