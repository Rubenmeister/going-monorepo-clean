'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';
import { AdminLayout } from '../components';
import { Loading } from '@going-monorepo-clean/shared-ui';
import { API } from '../../lib/admin-api';

interface SurgeRule {
  id: string; name: string; type: 'time' | 'demand' | 'manual';
  multiplier: number; active: boolean;
  days?: number[];        // 0=Dom…6=Sáb (solo type=time)
  hourFrom?: string;      // "HH:MM"
  hourTo?: string;
  minDemand?: number;     // solicitudes pendientes (type=demand)
  maxSupply?: number;     // conductores disponibles (type=demand)
  zones?: string[];       // ids de zonas
  expiresAt?: string;     // solo type=manual
  services?: string[];
}

interface DemandSnapshot {
  pendingRequests: number; availableDrivers: number;
  ratio: number; suggestedMultiplier: number; zone?: string;
}

async function safeGet<T>(token: string, path: string): Promise<T | null> {
  try {
    const r = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
    return r.ok ? r.json() : null;
  } catch { return null; }
}

async function adminFetch(token: string, path: string, opts?: RequestInit) {
  const r = await fetch(`${API}${path}`, {
    ...opts, headers: { Authorization:`Bearer ${token}`, 'Content-Type':'application/json', ...(opts?.headers??{}) },
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

const DAYS_LABELS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];



/** 24 barras vacías (×1.0) para cuando no hay historial aún */
const EMPTY_HISTORY = Array.from({ length: 12 }, (_, i) => ({
  hour: `${String(i * 2).padStart(2, '0')}h`,
  multiplier: 1.0,
}));

function multColor(m: number) {
  if (m <= 1.0) return '#6b7280';
  if (m <= 1.3) return '#f59e0b';
  if (m <= 1.6) return '#ea580c';
  return '#dc2626';
}

export default function SurgePage() {
  const { auth } = useMonorepoApp();
  const token: string = typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? '' : '';

  const [rules,    setRules]    = useState<SurgeRule[]>([]);
  const [demand,   setDemand]   = useState<DemandSnapshot[]>([]);
  const [history,  setHistory]  = useState<{hour:string;multiplier:number}[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [toastMsg, setToastMsg] = useState('');
  const [modal,    setModal]    = useState(false);
  const [manualMult, setManualMult] = useState(1.5);
  const [manualHours, setManualHours] = useState(2);
  const [activating, setActivating] = useState(false);

  const toast = (m: string) => { setToastMsg(m); setTimeout(() => setToastMsg(''), 3000); };

  const fetchData = useCallback(async () => {
    const [rData, dData, hData] = await Promise.all([
      safeGet<any>(token, '/pricing/surge/rules'),
      safeGet<any>(token, '/pricing/surge/demand'),
      safeGet<any>(token, '/pricing/surge/history'),
    ]);
    const rRaw: any[] = Array.isArray(rData) ? rData : rData?.data ?? rData?.items ?? [];
    setRules(rRaw);
    const dRaw: any[] = Array.isArray(dData) ? dData : dData?.data ?? dData?.zones ?? [];
    setDemand(dRaw);
    const hRaw: any[] = Array.isArray(hData) ? hData : hData?.data ?? hData?.history ?? [];
    setHistory(hRaw);
    setLoading(false);
  }, [token]);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 30_000);
    return () => clearInterval(id);
  }, [fetchData]);

  async function toggleRule(rule: SurgeRule) {
    try { await adminFetch(token, `/pricing/surge/rules/${rule.id}`, { method:'PATCH', body:JSON.stringify({ active:!rule.active }) }); } catch {}
    setRules(prev => prev.map(r => r.id === rule.id ? { ...r, active:!r.active } : r));
  }

  async function deleteRule(id: string) {
    if (!confirm('¿Eliminar esta regla?')) return;
    try { await adminFetch(token, `/pricing/surge/rules/${id}`, { method:'DELETE' }); } catch {}
    setRules(prev => prev.filter(r => r.id !== id));
    toast('Regla eliminada');
  }

  async function activateManual() {
    setActivating(true);
    const expiresAt = new Date(Date.now() + manualHours * 3600000).toISOString();
    const body = { type:'manual', name:`Surge manual ${manualMult}x`, multiplier:manualMult, expiresAt, active:true };
    try {
      const created = await adminFetch(token, '/pricing/surge/rules', { method:'POST', body:JSON.stringify(body) })
        .catch(() => ({ ...body, id:`manual_${Date.now()}` }));
      setRules(prev => [created, ...prev]);
      toast(`Surge ×${manualMult} activado por ${manualHours}h`);
    } catch { toast('Error al activar'); }
    setModal(false); setActivating(false);
  }

  if (auth.isLoading || loading) {
    return <Loading fullHeight size="lg" message="Cargando precios dinamicos..." />;
  }

  const activeRules = rules.filter(r => r.active);
  const maxMultActive = activeRules.reduce((m, r) => Math.max(m, r.multiplier), 1);
  const highDemandZones = demand.filter(d => d.ratio >= 2);

  return (
    <AdminLayout userName={auth.user?.firstName ?? 'Admin'} onLogout={auth.logout}>
      <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        ⚠️ <strong>Backend en construcción:</strong> las reglas de surge aún no son persistentes (almacenamiento temporal; se reinician al redeploy del servicio).
      </div>

      {toastMsg && <div className="fixed top-6 right-6 z-50 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg">{toastMsg}</div>}

      {/* Manual surge modal */}
      {modal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-bold text-lg text-gray-900 mb-5">⚡ Activar Surge Manual</h3>
            <div className="space-y-5">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  Multiplicador: <span style={{ color:multColor(manualMult) }}>×{manualMult.toFixed(1)}</span>
                </label>
                <input type="range" min={1.1} max={3.0} step={0.1} value={manualMult}
                  onChange={e => setManualMult(+e.target.value)} className="w-full" />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>×1.1 (+10%)</span><span>×2.0 (+100%)</span><span>×3.0 (+200%)</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Duración: {manualHours}h</label>
                <input type="range" min={1} max={12} step={1} value={manualHours}
                  onChange={e => setManualHours(+e.target.value)} className="w-full" />
                <div className="flex justify-between text-xs text-gray-400 mt-1"><span>1h</span><span>6h</span><span>12h</span></div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
                Los precios subirán ×{manualMult.toFixed(1)} en todos los servicios de transporte durante <strong>{manualHours} hora{manualHours>1?'s':''}</strong>.
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={activateManual} disabled={activating}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
                style={{ backgroundColor:'#ff4c41' }}>
                {activating ? 'Activando…' : `⚡ Activar ×${manualMult.toFixed(1)}`}
              </button>
              <button onClick={() => setModal(false)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Precios Dinámicos</h1>
          <p className="text-sm text-gray-500 mt-1">{activeRules.length} reglas activas · multiplicador actual: <strong style={{ color:multColor(maxMultActive) }}>×{maxMultActive.toFixed(1)}</strong></p>
        </div>
        <button onClick={() => setModal(true)}
          className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity"
          style={{ backgroundColor:'#ff4c41' }}>
          ⚡ Surge manual
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left: demand + chart */}
        <div className="space-y-5">

          {/* Real-time demand */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-gray-900 mb-3">Demanda en tiempo real</h2>
            <div className="space-y-3">
              {demand.map((d, i) => {
                const col = d.ratio >= 3 ? '#dc2626' : d.ratio >= 2 ? '#ea580c' : d.ratio >= 1.5 ? '#f59e0b' : '#22c55e';
                return (
                  <div key={i} className="rounded-xl border p-3" style={{ borderColor: col + '40', backgroundColor: col + '08' }}>
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm font-semibold text-gray-800 truncate">{d.zone}</p>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white flex-shrink-0" style={{ backgroundColor:col }}>
                        ratio {d.ratio.toFixed(1)}x
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>🙋 {d.pendingRequests} solicitudes</span>
                      <span>🚗 {d.availableDrivers} disponibles</span>
                    </div>
                    {d.suggestedMultiplier > 1 && (
                      <p className="text-xs font-semibold mt-2" style={{ color:col }}>
                        💡 Surge sugerido: ×{d.suggestedMultiplier.toFixed(1)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hourly chart */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-gray-900 mb-3">Multiplicador hoy</h2>
            <div className="flex items-end gap-1 h-24">
              {(history.length > 0 ? history : EMPTY_HISTORY).map(h => {
                const pct = ((h.multiplier - 1) / 2) * 100;
                const col = history.length > 0 ? multColor(h.multiplier) : '#e5e7eb';
                return (
                  <div key={h.hour} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full rounded-t-sm" style={{ height:`${Math.max(4, pct)}%`, backgroundColor:col, minHeight:'4px' }} />
                    <span className="text-gray-300" style={{ fontSize:'8px', writingMode:'vertical-lr', transform:'rotate(180deg)' }}>{h.hour}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>×1.0</span><span>×2.0</span><span>×3.0</span>
            </div>
            {history.length === 0 && <p className="text-xs text-gray-400 text-center mt-1">Sin historial aún — las barras se llenarán con datos reales</p>}
          </div>
        </div>

        {/* Right: rules */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900">Reglas de precios</h2>
            <span className="text-xs text-gray-500">{activeRules.length} de {rules.length} activas</span>
          </div>
          <div className="space-y-3">
            {rules.map(rule => {
              const col = multColor(rule.multiplier);
              const isManual = rule.type === 'manual';
              const expiresSoon = isManual && rule.expiresAt && new Date(rule.expiresAt).getTime() - Date.now() < 3600000;
              return (
                <div key={rule.id} className={`bg-white rounded-2xl border p-4 shadow-sm ${!rule.active ? 'opacity-50' : ''}`}
                  style={{ borderLeft:`4px solid ${col}` }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-semibold text-gray-900 text-sm">{rule.name}</p>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ backgroundColor: col+'15', color:col }}>
                          {rule.type === 'time' ? '🕐 Horario' : rule.type === 'demand' ? '📊 Demanda' : '⚡ Manual'}
                        </span>
                        {expiresSoon && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium animate-pulse">Expira pronto</span>}
                      </div>
                      <div className="text-xs text-gray-500 space-y-0.5">
                        {rule.type === 'time' && rule.days && (
                          <p>📅 {rule.days.map(d => DAYS_LABELS[d]).join(', ')} · ⏰ {rule.hourFrom}–{rule.hourTo}</p>
                        )}
                        {rule.type === 'demand' && (
                          <p>Activa si &gt;{rule.minDemand} solicitudes y &lt;{rule.maxSupply} conductores disponibles</p>
                        )}
                        {rule.type === 'manual' && rule.expiresAt && (
                          <p>Expira: {new Date(rule.expiresAt).toLocaleTimeString('es-EC', { hour:'2-digit', minute:'2-digit' })}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className="text-2xl font-black" style={{ color:col }}>×{rule.multiplier.toFixed(1)}</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleRule(rule)}
                          className={`w-10 h-6 rounded-full transition-colors relative ${rule.active ? 'bg-green-500' : 'bg-gray-200'}`}>
                          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${rule.active ? 'left-4' : 'left-0.5'}`} />
                        </button>
                        <button onClick={() => deleteRule(rule.id)} className="text-red-400 hover:text-red-600 text-sm">🗑</button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 flex gap-4 text-xs flex-wrap">
            {[['×1.0–1.3','#f59e0b','Normal'],['×1.4–1.6','#ea580c','Alto'],['×1.7+','#dc2626','Muy alto']].map(([r,c,l]) => (
              <span key={r} className="flex items-center gap-1.5 text-gray-700">
                <span className="w-3 h-3 rounded-full" style={{ background: c }} />
                <span className="font-medium">{r}</span>
                <span className="text-gray-500">· {l}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}