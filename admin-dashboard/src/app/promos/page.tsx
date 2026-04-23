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
  if (\!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

interface Promo {
  id: string; code: string; description?: string;
  type: 'percent' | 'fixed';
  value: number; minAmount?: number; maxUses?: number;
  usedCount?: number; active: boolean;
  expiresAt?: string; createdAt?: string;
  serviceType?: string;
}

const TYPE_LABELS = { percent: '% Porcentaje', fixed: 'S/ Monto fijo' };

function PromoModal({ promo, token, onClose, onSaved }: {
  promo?: Promo; token: string; onClose: () => void; onSaved: (p: Promo) => void;
}) {
  const [form, setForm] = useState({
    code: promo?.code ?? '', description: promo?.description ?? '',
    type: promo?.type ?? 'percent', value: promo?.value ?? 10,
    minAmount: promo?.minAmount ?? 0, maxUses: promo?.maxUses ?? 100,
    expiresAt: promo?.expiresAt?.slice(0,10) ?? '',
    serviceType: promo?.serviceType ?? '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  async function save() {
    if (\!form.code.trim()) { setError('El código es obligatorio'); return; }
    setLoading(true); setError('');
    try {
      const body = { ...form, value: Number(form.value), minAmount: Number(form.minAmount), maxUses: Number(form.maxUses) };
      const saved = promo
        ? await req<Promo>(token, `/promotions/${promo.id}`, { method:'PATCH', body:JSON.stringify(body) })
        : await req<Promo>(token, '/promotions', { method:'POST', body:JSON.stringify(body) });
      onSaved(saved);
    } catch (e: any) { setError(e.message ?? 'Error al guardar'); }
    finally { setLoading(false); }
  }

  const input = 'w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-base font-bold text-gray-900">{promo ? 'Editar' : 'Nuevo'} código promocional</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Código *</label>
              <input value={form.code} onChange={e => set('code', e.target.value.toUpperCase())}
                className={input} placeholder="PROMO20" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Tipo</label>
              <select value={form.type} onChange={e => set('type', e.target.value)} className={input}>
                <option value="percent">% Porcentaje</option>
                <option value="fixed">S/ Monto fijo</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Valor</label>
              <input type="number" value={form.value} onChange={e => set('value', e.target.value)} className={input} min={1} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Monto mínimo</label>
              <input type="number" value={form.minAmount} onChange={e => set('minAmount', e.target.value)} className={input} min={0} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Usos máximos</label>
              <input type="number" value={form.maxUses} onChange={e => set('maxUses', e.target.value)} className={input} min={1} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Expira</label>
              <input type="date" value={form.expiresAt} onChange={e => set('expiresAt', e.target.value)} className={input} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Servicio</label>
              <select value={form.serviceType} onChange={e => set('serviceType', e.target.value)} className={input}>
                <option value="">Todos</option>
                {['transporte','tours','experiencias','alojamientos','envios'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Descripción</label>
              <input value={form.description} onChange={e => set('description', e.target.value)} className={input} placeholder="Promo de bienvenida…" />
            </div>
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Cancelar</button>
            <button onClick={save} disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50"
              style={{ backgroundColor: '#ff4c41' }}>
              {loading ? 'Guardando…' : promo ? 'Guardar cambios' : 'Crear código'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PromosPage() {
  const { auth } = useMonorepoApp();
  const token: string = typeof window \!== 'undefined' ? localStorage.getItem('authToken') ?? '' : '';
  const [promos,   setPromos]   = useState<Promo[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [editing,  setEditing]  = useState<Promo | undefined>();
  const [creating, setCreating] = useState(false);
  const [toast,    setToast]    = useState('');

  const notify = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await req<any>(token, '/promotions');
      setPromos(Array.isArray(res) ? res : res?.data ?? res?.items ?? []);
    } catch { setPromos([]); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function toggle(promo: Promo) {
    try {
      await req(token, `/promotions/${promo.id}`, { method:'PATCH', body: JSON.stringify({ active: \!promo.active }) });
      setPromos(p => p.map(pr => pr.id === promo.id ? { ...pr, active: \!pr.active } : pr));
      notify(promo.active ? 'Código desactivado' : 'Código activado');
    } catch { notify('Error al actualizar'); }
  }

  async function remove(promo: Promo) {
    if (\!confirm(`¿Eliminar el código "${promo.code}"?`)) return;
    try {
      await req(token, `/promotions/${promo.id}`, { method:'DELETE' });
      setPromos(p => p.filter(pr => pr.id \!== promo.id));
      notify('Código eliminado');
    } catch { notify('Error al eliminar'); }
  }

  const active   = promos.filter(p => p.active);
  const inactive = promos.filter(p => \!p.active);
  const totalUses = promos.reduce((s, p) => s + (p.usedCount ?? 0), 0);

  if (auth.isLoading || loading) return <Loading fullHeight size="lg" message="Cargando promociones…" />;

  return (
    <AdminLayout userName={auth.user?.firstName ?? 'Admin'} onLogout={auth.logout}>
      {toast && <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white text-sm px-4 py-2 rounded-xl shadow">{toast}</div>}
      {(creating || editing) && (
        <PromoModal promo={editing} token={token} onClose={() => { setCreating(false); setEditing(undefined); }}
          onSaved={p => {
            setPromos(prev => editing ? prev.map(pr => pr.id === p.id ? p : pr) : [p, ...prev]);
            setCreating(false); setEditing(undefined);
            notify(editing ? 'Código actualizado' : 'Código creado');
          }} />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Códigos Promocionales</h1>
          <p className="text-sm text-gray-500 mt-1">Gestiona descuentos y promociones de la plataforma</p>
        </div>
        <button onClick={() => setCreating(true)}
          className="px-5 py-2.5 rounded-xl text-white text-sm font-bold shadow-sm hover:opacity-90"
          style={{ backgroundColor: '#ff4c41' }}>
          + Nuevo código
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label:'Total códigos', value:promos.length, color:'text-gray-900' },
          { label:'Activos',       value:active.length, color:'text-green-600' },
          { label:'Usos totales',  value:totalUses,     color:'text-blue-600'  },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <p className="text-xs text-gray-500">{k.label}</p>
            <p className={`text-2xl font-black mt-1 ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {promos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
          <p className="text-4xl mb-3">🎟️</p>
          <p className="text-gray-600 font-semibold">No hay códigos creados</p>
          <p className="text-sm text-gray-400 mt-1">Crea el primer código promocional</p>
          <button onClick={() => setCreating(true)} className="mt-4 px-4 py-2 text-sm font-bold text-white rounded-xl" style={{backgroundColor:'#ff4c41'}}>
            + Crear código
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Código','Descuento','Servicio','Usos','Expira','Estado',''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {promos.map(p => {
                const expired = p.expiresAt && new Date(p.expiresAt) < new Date();
                return (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-mono font-bold text-gray-900">{p.code}</p>
                      {p.description && <p className="text-xs text-gray-400">{p.description}</p>}
                    </td>
                    <td className="px-4 py-3 font-bold" style={{color:'#ff4c41'}}>
                      {p.type === 'percent' ? `${p.value}%` : `S/ ${p.value}`}
                      {p.minAmount ? <span className="text-xs text-gray-400 ml-1">min S/{p.minAmount}</span> : null}
                    </td>
                    <td className="px-4 py-3 text-gray-600 capitalize">{p.serviceType || 'Todos'}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-gray-900">{p.usedCount ?? 0}</span>
                      {p.maxUses && <span className="text-xs text-gray-400"> / {p.maxUses}</span>}
                    </td>
                    <td className="px-4 py-3">
                      {p.expiresAt
                        ? <span className={expired ? 'text-red-500 font-semibold' : 'text-gray-600'}>{p.expiresAt.slice(0,10)}</span>
                        : <span className="text-gray-400">Sin límite</span>}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggle(p)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${p.active ? 'bg-green-500' : 'bg-gray-300'}`}>
                        <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${p.active ? 'translate-x-4' : 'translate-x-1'}`} />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => setEditing(p)} className="text-xs text-blue-600 hover:underline">Editar</button>
                        <button onClick={() => remove(p)} className="text-xs text-red-500 hover:underline">Eliminar</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
