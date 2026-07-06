'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';
import { AdminLayout } from '../components';
import { Loading } from '@going-monorepo-clean/shared-ui';

// Panel del MOTOR DE TARIFAS. Llama al proxy same-origin /api/pricing/* que
// inyecta el x-admin-token server-side (el browser nunca lo ve).
async function pReq<T>(token: string, path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`/api/pricing${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(opts?.headers ?? {}) },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text.slice(0, 160) || `${res.status}`);
  return text ? JSON.parse(text) : ({} as T);
}

interface FareList { id: string; name: string; service: string; version: number; active: boolean; pairs: number; }
interface Rule {
  id: string; name: string; active: boolean; group?: string; priority?: number;
  condition?: any; effect?: any; validTo?: string | null;
}

const SERVICES = ['compartido', 'privado', 'empresas', 'urbano'];

function condLabel(c: any): string {
  if (!c) return '';
  if (c.type === 'time_window') return `${String(c.fromHour).padStart(2, '0')}:00–${String(c.toHour).padStart(2, '0')}:00`;
  if (c.type === 'day_of_week') return `días ${(c.days || []).join(',')}`;
  if (c.type === 'holiday') return 'feriado';
  if (c.type === 'promo_code') return `código ${c.code}`;
  if (c.type === 'always') return 'siempre';
  return c.type ?? '';
}
function effLabel(e: any): string {
  if (!e) return '';
  if (e.type === 'surcharge_rate') return `+${Math.round(e.value * 100)}%`;
  if (e.type === 'discount_rate') return `−${Math.round(e.value * 100)}%`;
  if (e.type === 'flat_override') return `= $${e.value}`;
  if (e.type === 'multiplier') return `×${e.value}`;
  if (e.type === 'flat_add') return `${e.value >= 0 ? '+' : ''}$${e.value}`;
  return `${e.type} ${e.value}`;
}

export default function TarifasPage() {
  const { auth } = useMonorepoApp();
  const [token, setToken] = useState('');
  const [lists, setLists] = useState<FareList[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  // Form editar tarifa
  const [fListId, setFListId] = useState('');
  const [fRoute, setFRoute] = useState('');
  const [fVeh, setFVeh] = useState('suv');
  const [fPrice, setFPrice] = useState('');
  // Form promo
  const [pCode, setPCode] = useState('');
  const [pPct, setPPct] = useState('10');
  const [pUntil, setPUntil] = useState('');
  // Form cargar lista completa
  const [bSvc, setBSvc] = useState('compartido');
  const [bName, setBName] = useState('');
  const [bText, setBText] = useState('');

  const load = useCallback(async (t: string) => {
    setLoading(true); setErr('');
    try {
      const [l, r] = await Promise.all([
        pReq<FareList[]>(t, '/lists'),
        pReq<Rule[]>(t, '/rules'),
      ]);
      setLists(l); setRules(r);
    } catch (e: any) { setErr(e.message ?? 'Error cargando'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const t = (typeof window !== 'undefined' && localStorage.getItem('authToken')) || '';
    setToken(t);
    if (t) load(t);
  }, [load]);

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3500); };

  async function saveFare() {
    setErr('');
    const list = lists.find((x) => x.id === fListId);
    if (!list || !fRoute.includes('-') || !fPrice) { setErr('Elige lista, ruta "origen-destino" y precio'); return; }
    const price = Number(fPrice);
    const body: any = {};
    if (list.service === 'compartido') body.shared = { [fRoute.toLowerCase()]: price };
    else body.privateFares = { [fRoute.toLowerCase()]: { [fVeh]: price } };
    try {
      await pReq(token, `/lists/${list.id}/fares`, { method: 'PATCH', body: JSON.stringify(body) });
      flash(`Tarifa ${fRoute} guardada en "${list.service}" — aplica en vivo`);
      setFPrice(''); load(token);
    } catch (e: any) { setErr(e.message); }
  }

  async function uploadList() {
    setErr('');
    if (!bName.trim()) { setErr('Ponle un nombre a la lista'); return; }
    // Cada línea: compartido → "origen,destino,precio"; privado/empresas →
    // "origen,destino,vehiculo,precio". Acepta comas O tabs (pegar del Excel).
    const shared: Record<string, number> = {};
    const privateFares: Record<string, Record<string, number>> = {};
    let n = 0, bad = 0;
    for (const raw of bText.split('\n')) {
      const line = raw.trim();
      if (!line) continue;
      const c = line.split(/[,\t;]/).map((x) => x.trim());
      if (bSvc === 'compartido') {
        const [o, d, p] = c;
        const price = Number(p);
        if (!o || !d || !p || Number.isNaN(price)) { bad++; continue; }
        shared[`${o}-${d}`.toLowerCase()] = price; n++;
      } else {
        const [o, d, veh, p] = c;
        const price = Number(p);
        if (!o || !d || !veh || Number.isNaN(price)) { bad++; continue; }
        const key = `${o}-${d}`.toLowerCase();
        (privateFares[key] ??= {})[veh.toLowerCase()] = price; n++;
      }
    }
    if (!n) { setErr('No pude leer filas válidas. Formato: ' + (bSvc === 'compartido' ? 'origen,destino,precio' : 'origen,destino,vehiculo,precio')); return; }
    try {
      const body: any = { name: bName.trim(), service: bSvc, activate: true };
      if (bSvc === 'compartido') body.shared = shared; else body.privateFares = privateFares;
      await pReq(token, '/lists', { method: 'POST', body: JSON.stringify(body) });
      flash(`Lista "${bName}" cargada y activada en ${bSvc}: ${n} rutas${bad ? ` (${bad} filas ignoradas)` : ''}`);
      setBText(''); setBName(''); load(token);
    } catch (e: any) { setErr(e.message); }
  }

  async function setRuleValue(rule: Rule, value: number) {
    try {
      await pReq(token, '/rules', {
        method: 'POST',
        body: JSON.stringify({
          name: rule.name, group: rule.group, priority: rule.priority,
          scope: (rule as any).scope, condition: rule.condition,
          effect: { ...rule.effect, value },
          validTo: rule.validTo ?? null,
        }),
      });
      flash(`Regla "${rule.name}" actualizada`); load(token);
    } catch (e: any) { setErr(e.message); }
  }

  async function toggleRule(rule: Rule) {
    try {
      await pReq(token, `/rules/${rule.id}/active`, { method: 'POST', body: JSON.stringify({ active: !rule.active }) });
      load(token);
    } catch (e: any) { setErr(e.message); }
  }

  async function createPromo() {
    setErr('');
    if (!pCode.trim()) { setErr('Código requerido'); return; }
    try {
      await pReq(token, '/rules', {
        method: 'POST',
        body: JSON.stringify({
          name: `Promo ${pCode.trim().toUpperCase()}`,
          condition: { type: 'promo_code', code: pCode.trim().toUpperCase() },
          effect: { type: 'discount_rate', value: Number(pPct) / 100 },
          validTo: pUntil ? new Date(pUntil + 'T23:59:59Z').toISOString() : null,
        }),
      });
      flash(`Promo ${pCode.toUpperCase()} creada (−${pPct}%)`);
      setPCode(''); load(token);
    } catch (e: any) { setErr(e.message); }
  }

  if (auth.isLoading || loading) return <Loading fullHeight size="lg" message="Cargando motor de tarifas…" />;

  const surgeRules = rules.filter((r) => r.effect?.type === 'surcharge_rate');
  const promoRules = rules.filter((r) => r.condition?.type === 'promo_code');
  const providerRules = rules.filter((r) => r.effect?.type === 'flat_override');

  return (
    <AdminLayout userName={auth.user?.firstName ?? 'Admin'} onLogout={auth.logout}>
      <div className="p-6 space-y-6 max-w-5xl">
        <div>
          <h1 className="text-2xl font-black text-gray-900">🧮 Motor de tarifas</h1>
          <p className="text-sm text-gray-500">Precios y reglas editables en vivo — los cambios aplican al instante, sin deploy.</p>
        </div>
        {msg && <div className="rounded-xl bg-green-50 border border-green-200 text-green-800 px-4 py-2 text-sm">✅ {msg}</div>}
        {err && <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm">⚠️ {err}</div>}

        {/* Listas por servicio */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-black text-gray-800 mb-3">Listas activas por servicio</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {SERVICES.map((s) => {
              const l = lists.find((x) => x.active && x.service === s);
              return (
                <div key={s} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                  <p className="text-[11px] uppercase tracking-wider text-gray-400 font-bold">{s}</p>
                  <p className="text-sm font-bold text-gray-800">{l ? `v${l.version} · ${l.pairs} rutas` : '—'}</p>
                  <p className="text-xs text-gray-400 truncate">{l?.name ?? 'sin lista'}</p>
                </div>
              );
            })}
          </div>
          {/* Editar tarifa */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-sm font-bold text-gray-700 mb-2">Editar / añadir una tarifa</p>
            <div className="flex flex-wrap items-end gap-2">
              <select value={fListId} onChange={(e) => setFListId(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
                <option value="">Lista…</option>
                {lists.filter((l) => l.active).map((l) => <option key={l.id} value={l.id}>{l.service} v{l.version}</option>)}
              </select>
              <input value={fRoute} onChange={(e) => setFRoute(e.target.value)} placeholder="origen-destino (ej. ibarra-quito)" className="border rounded-lg px-3 py-2 text-sm w-56" />
              {lists.find((l) => l.id === fListId)?.service !== 'compartido' && lists.find((l) => l.id === fListId) && (
                <select value={fVeh} onChange={(e) => setFVeh(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
                  {['suv', 'suv_xl', 'van', 'van_xl', 'minibus', 'bus'].map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              )}
              <input value={fPrice} onChange={(e) => setFPrice(e.target.value)} placeholder="$" type="number" className="border rounded-lg px-3 py-2 text-sm w-24" />
              <button onClick={saveFare} className="bg-[#0033A0] text-white text-sm font-bold px-4 py-2 rounded-lg">Guardar</button>
            </div>
          </div>

          {/* Cargar lista completa (pegar del Excel) */}
          <div className="border-t border-gray-100 pt-4 mt-4">
            <p className="text-sm font-bold text-gray-700">Cargar lista completa</p>
            <p className="text-xs text-gray-400 mb-2">
              Crea una lista nueva y la activa (retira la anterior de ese servicio). Pega filas — una por línea,
              separadas por coma o tab (puedes copiar del Excel). Formato:{' '}
              <span className="font-mono text-gray-600">{bSvc === 'compartido' ? 'origen,destino,precio' : 'origen,destino,vehiculo,precio'}</span>
            </p>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <select value={bSvc} onChange={(e) => setBSvc(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
                {SERVICES.filter((s) => s !== 'urbano').map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <input value={bName} onChange={(e) => setBName(e.target.value)} placeholder="Nombre de la lista (ej. Tarifas jul-2026)" className="border rounded-lg px-3 py-2 text-sm w-64" />
            </div>
            <textarea value={bText} onChange={(e) => setBText(e.target.value)} rows={5}
              placeholder={bSvc === 'compartido' ? 'ibarra,quito,15\notavalo,quito,9\n…' : 'ibarra,quito,suv,60\nibarra,quito,van,80\n…'}
              className="border rounded-lg px-3 py-2 text-sm w-full font-mono" />
            <button onClick={uploadList} className="mt-2 bg-[#0033A0] text-white text-sm font-bold px-4 py-2 rounded-lg">Cargar y activar</button>
          </div>
        </section>

        {/* Reglas de recargo */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-black text-gray-800 mb-3">Reglas de recargo</h2>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-400 text-xs uppercase"><th className="py-1">Regla</th><th>Cuándo</th><th>Recargo</th><th></th></tr></thead>
            <tbody>
              {surgeRules.map((r) => (
                <tr key={r.id} className="border-t border-gray-50">
                  <td className="py-2 font-medium text-gray-800">{r.name}</td>
                  <td className="text-gray-500">{condLabel(r.condition)}</td>
                  <td>
                    <div className="flex items-center gap-1">
                      <input type="number" defaultValue={Math.round((r.effect?.value ?? 0) * 100)} step={1}
                        onBlur={(e) => { const v = Number(e.target.value) / 100; if (v !== r.effect?.value) setRuleValue(r, v); }}
                        className="border rounded-lg px-2 py-1 w-16 text-sm" />
                      <span className="text-gray-400">%</span>
                    </div>
                  </td>
                  <td className="text-right">
                    <button onClick={() => toggleRule(r)} className={`text-xs px-2 py-1 rounded-full font-bold ${r.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{r.active ? 'activa' : 'inactiva'}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Promos */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-black text-gray-800 mb-3">Promociones</h2>
          <div className="flex flex-wrap items-end gap-2 mb-4">
            <input value={pCode} onChange={(e) => setPCode(e.target.value)} placeholder="CÓDIGO" className="border rounded-lg px-3 py-2 text-sm w-40 uppercase" />
            <div><span className="text-xs text-gray-400">descuento %</span><input value={pPct} onChange={(e) => setPPct(e.target.value)} type="number" className="border rounded-lg px-3 py-2 text-sm w-20 block" /></div>
            <div><span className="text-xs text-gray-400">vence (opcional)</span><input value={pUntil} onChange={(e) => setPUntil(e.target.value)} type="date" className="border rounded-lg px-3 py-2 text-sm block" /></div>
            <button onClick={createPromo} className="bg-[#ff4c41] text-white text-sm font-bold px-4 py-2 rounded-lg">Crear promo</button>
          </div>
          <table className="w-full text-sm">
            <tbody>
              {promoRules.map((r) => (
                <tr key={r.id} className="border-t border-gray-50">
                  <td className="py-2 font-mono font-bold text-gray-800">{r.condition?.code}</td>
                  <td>{effLabel(r.effect)}</td>
                  <td className="text-gray-500 text-xs">{r.validTo ? `vence ${r.validTo.slice(0, 10)}` : 'sin vencimiento'}</td>
                  <td className="text-right"><button onClick={() => toggleRule(r)} className={`text-xs px-2 py-1 rounded-full font-bold ${r.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{r.active ? 'activa' : 'inactiva'}</button></td>
                </tr>
              ))}
              {!promoRules.length && <tr><td className="py-2 text-gray-400 text-sm">Sin promos activas.</td></tr>}
            </tbody>
          </table>
        </section>

        {!!providerRules.length && (
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-black text-gray-800 mb-3">Precio por conductor ({providerRules.length})</h2>
            <p className="text-xs text-gray-400">Overrides por conductor (con tope ±30%). Gestión avanzada por API.</p>
          </section>
        )}
      </div>
    </AdminLayout>
  );
}
