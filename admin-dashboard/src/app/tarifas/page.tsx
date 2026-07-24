'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { useMonorepoApp } from '@/lib/providers';
import { AdminLayout } from '../components';
import { Loading } from '@/lib/shared-ui';

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
interface CambioPrecio { ruta: string; vehiculo: string | null; antes: number; despues: number; delta: number; deltaPct: number; }
interface EntradaTarifa { ruta: string; vehiculo: string | null; precio: number; }
interface DiffTarifas {
  borrador: { id: string; name: string; service: string; version: number };
  activa: { version: number; name: string } | null;
  resumen: { cambios: number; nuevas: number; eliminadas: number; sinCambio: number; variacionPromedioPct: number };
  cambios: CambioPrecio[];
  nuevas: EntradaTarifa[];
  eliminadas: EntradaTarifa[];
  alertas: string[];
}
interface HistItem {
  id: string; version: number; active: boolean; publishedBy: string | null;
  publishedAt: string | null; reason: string | null; rolledBackFrom: number | null;
}
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
  // Flujo borrador → diff → publicación
  const [diff, setDiff] = useState<DiffTarifas | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  // Historial por servicio (para vuelta atrás)
  const [histSvc, setHistSvc] = useState('privado');
  const [hist, setHist] = useState<HistItem[]>([]);

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

  /** Pide el diff de un borrador y abre el panel de revisión. */
  async function revisar(borradorId: string) {
    const d = await pReq<DiffTarifas>(token, `/lists/${borradorId}/diff`);
    setDiff(d); setReason('');
  }

  // Editar/añadir UNA tarifa: se hace sobre un BORRADOR (copia de la activa),
  // no en vivo. Así el cambio pasa por diff + motivo + vuelta atrás, igual que
  // una carga completa. Editar la lista activa directamente está bloqueado.
  async function saveFare() {
    setErr('');
    const list = lists.find((x) => x.id === fListId);
    if (!list || !fRoute.includes('-') || !fPrice) { setErr('Elige servicio, ruta "origen-destino" y precio'); return; }
    const price = Number(fPrice);
    if (Number.isNaN(price) || price < 0) { setErr('El precio debe ser un número válido'); return; }
    setBusy(true);
    try {
      const { id } = await pReq<{ id: string }>(token, `/lists/draft/${list.service}`, { method: 'POST', body: '{}' });
      const body: any = {};
      if (list.service === 'compartido') body.shared = { [fRoute.toLowerCase()]: price };
      else body.privateFares = { [fRoute.toLowerCase()]: { [fVeh]: price } };
      await pReq(token, `/lists/${id}/fares`, { method: 'PATCH', body: JSON.stringify(body) });
      await revisar(id);
      setFPrice('');
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  }

  // Carga una lista completa como BORRADOR (inactivo) y muestra el diff. No
  // activa nada hasta que se publique con un motivo.
  async function uploadList() {
    setErr('');
    if (!bName.trim()) { setErr('Ponle un nombre a la lista'); return; }
    // compartido → "origen,destino,precio"; privado/empresas → "origen,destino,vehiculo,precio".
    // Acepta comas, tabs o punto y coma (pegar del Excel).
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
        (privateFares[`${o}-${d}`.toLowerCase()] ??= {})[veh.toLowerCase()] = price; n++;
      }
    }
    if (!n) { setErr('No pude leer filas válidas. Formato: ' + (bSvc === 'compartido' ? 'origen,destino,precio' : 'origen,destino,vehiculo,precio')); return; }
    setBusy(true);
    try {
      const body: any = { name: bName.trim(), service: bSvc, activate: false };
      if (bSvc === 'compartido') body.shared = shared; else body.privateFares = privateFares;
      const { id } = await pReq<{ id: string }>(token, '/lists', { method: 'POST', body: JSON.stringify(body) });
      await revisar(id);
      if (bad) flash(`Borrador creado: ${n} rutas leídas, ${bad} filas ignoradas. Revisa el diff antes de publicar.`);
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  }

  // Publica el borrador en revisión. El motivo es obligatorio (queda en el historial).
  async function publicar() {
    if (!diff) return;
    if (reason.trim().length < 5) { setErr('Escribe el motivo del cambio (mínimo 5 caracteres)'); return; }
    setBusy(true); setErr('');
    try {
      await pReq(token, `/lists/${diff.borrador.id}/publish`, {
        method: 'POST',
        body: JSON.stringify({ reason: reason.trim(), publishedBy: auth.user?.firstName ?? 'admin' }),
      });
      flash(`Publicada v${diff.borrador.version} de ${diff.borrador.service} — aplica en vivo`);
      setDiff(null); setBText(''); setBName(''); load(token);
      if (histSvc === diff.borrador.service) loadHist(diff.borrador.service);
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  }

  // Descarta el borrador en revisión (lo borra; nunca estuvo activo).
  async function descartar() {
    if (!diff) return;
    setBusy(true); setErr('');
    try {
      await pReq(token, `/lists/${diff.borrador.id}`, { method: 'DELETE' });
      setDiff(null);
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  }

  const loadHist = useCallback(async (svc: string) => {
    try { setHist(await pReq<HistItem[]>(token, `/lists/history/${svc}`)); }
    catch { setHist([]); }
  }, [token]);

  async function rollback(svc: string, version: number) {
    const motivo = window.prompt(`Volver a la versión ${version} de ${svc}. Motivo:`, `Vuelta atrás a v${version}`);
    if (!motivo || motivo.trim().length < 5) { setErr('Vuelta atrás cancelada: falta el motivo'); return; }
    setBusy(true); setErr('');
    try {
      await pReq(token, `/lists/rollback/${svc}/${version}`, { method: 'POST', body: JSON.stringify({ reason: motivo.trim(), publishedBy: auth.user?.firstName ?? 'admin' }) });
      flash(`${svc}: restaurada la v${version} como versión nueva`);
      load(token); loadHist(svc);
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
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
              <button onClick={saveFare} disabled={busy} className="bg-[#0033A0] text-white text-sm font-bold px-4 py-2 rounded-lg disabled:opacity-50">Preparar cambio</button>
            </div>
            <p className="text-xs text-gray-400 mt-1">Verás el antes/después antes de publicar. Nada cambia en vivo hasta que confirmes con un motivo.</p>
          </div>

          {/* Cargar lista completa (pegar del Excel) */}
          <div className="border-t border-gray-100 pt-4 mt-4">
            <p className="text-sm font-bold text-gray-700">Cargar lista completa (desde el Excel)</p>
            <p className="text-xs text-gray-400 mb-2">
              Copia las celdas del Excel y pégalas aquí — una fila por línea. Se crea un <b>borrador</b> y verás
              exactamente qué cambia <b>antes</b> de publicar. Formato:{' '}
              <span className="font-mono text-gray-600">{bSvc === 'compartido' ? 'origen,destino,precio' : 'origen,destino,vehiculo,precio'}</span>
            </p>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <select value={bSvc} onChange={(e) => setBSvc(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
                {SERVICES.filter((s) => s !== 'urbano' && s !== 'empresas').map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <input value={bName} onChange={(e) => setBName(e.target.value)} placeholder="Nombre de la lista (ej. Tarifas jul-2026)" className="border rounded-lg px-3 py-2 text-sm w-64" />
            </div>
            <textarea value={bText} onChange={(e) => setBText(e.target.value)} rows={5}
              placeholder={bSvc === 'compartido' ? 'ibarra,quito,15\notavalo,quito,9\n…' : 'ibarra,quito,suv,60\nibarra,quito,van,80\n…'}
              className="border rounded-lg px-3 py-2 text-sm w-full font-mono" />
            <button onClick={uploadList} disabled={busy} className="mt-2 bg-[#0033A0] text-white text-sm font-bold px-4 py-2 rounded-lg disabled:opacity-50">Preparar borrador y ver cambios</button>
            <p className="text-[11px] text-gray-400 mt-1">Nota: el corporativo se calcula solo (privado + recargo por empresa), no se carga aquí.</p>
          </div>
        </section>

        {/* Panel de revisión del diff — nada se publica sin pasar por aquí */}
        {diff && (
          <section className="bg-white rounded-2xl border-2 border-[#0033A0] shadow-lg p-5">
            <h2 className="font-black text-gray-800 mb-1">Revisar cambios antes de publicar</h2>
            <p className="text-sm text-gray-500 mb-3">
              Borrador <b>v{diff.borrador.version}</b> de <b>{diff.borrador.service}</b>
              {diff.activa ? <> vs. lo que está en vivo (v{diff.activa.version})</> : <> (no hay lista activa previa)</>}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              <div className="rounded-xl bg-amber-50 p-3"><p className="text-2xl font-black text-amber-700">{diff.resumen.cambios}</p><p className="text-xs text-amber-800">precios cambian</p></div>
              <div className="rounded-xl bg-green-50 p-3"><p className="text-2xl font-black text-green-700">{diff.resumen.nuevas}</p><p className="text-xs text-green-800">rutas nuevas</p></div>
              <div className="rounded-xl bg-red-50 p-3"><p className="text-2xl font-black text-red-700">{diff.resumen.eliminadas}</p><p className="text-xs text-red-800">desaparecen</p></div>
              <div className="rounded-xl bg-gray-50 p-3"><p className="text-2xl font-black text-gray-600">{diff.resumen.sinCambio}</p><p className="text-xs text-gray-500">sin cambio</p></div>
            </div>

            {!!diff.alertas.length && (
              <div className="rounded-xl bg-amber-50 border border-amber-300 p-3 mb-3">
                {diff.alertas.map((a, i) => <p key={i} className="text-sm text-amber-900">⚠️ {a}</p>)}
              </div>
            )}

            {!!diff.cambios.length && (
              <div className="max-h-64 overflow-auto border border-gray-100 rounded-xl mb-3">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0"><tr className="text-left text-gray-400 text-xs uppercase"><th className="py-1.5 px-3">Ruta</th><th>Veh</th><th>Antes</th><th>Después</th><th>Δ</th></tr></thead>
                  <tbody>
                    {diff.cambios.map((c, i) => (
                      <tr key={i} className="border-t border-gray-50">
                        <td className="py-1.5 px-3 font-mono text-xs text-gray-700">{c.ruta}</td>
                        <td className="text-gray-500">{c.vehiculo ?? '—'}</td>
                        <td className="text-gray-500">${c.antes}</td>
                        <td className="font-bold text-gray-800">${c.despues}</td>
                        <td className={c.delta > 0 ? 'text-red-600 font-bold' : 'text-green-600 font-bold'}>{c.delta > 0 ? '+' : ''}{c.deltaPct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex flex-wrap items-end gap-2 border-t border-gray-100 pt-3">
              <div className="flex-1 min-w-[240px]">
                <label className="text-xs text-gray-500 font-bold">Motivo del cambio (queda en el historial)</label>
                <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="ej. baja de demanda en la sierra centro" className="border rounded-lg px-3 py-2 text-sm w-full" />
              </div>
              <button onClick={publicar} disabled={busy} className="bg-green-600 text-white text-sm font-bold px-5 py-2 rounded-lg disabled:opacity-50">Publicar</button>
              <button onClick={descartar} disabled={busy} className="bg-gray-100 text-gray-600 text-sm font-bold px-4 py-2 rounded-lg disabled:opacity-50">Descartar</button>
            </div>
          </section>
        )}

        {/* Historial + vuelta atrás */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="font-black text-gray-800">Historial de versiones</h2>
            <select value={histSvc} onChange={(e) => { setHistSvc(e.target.value); loadHist(e.target.value); }} className="border rounded-lg px-2 py-1 text-sm ml-auto">
              {SERVICES.filter((s) => s !== 'urbano' && s !== 'empresas').map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <button onClick={() => loadHist(histSvc)} className="text-xs bg-gray-100 px-3 py-1.5 rounded-lg font-bold text-gray-600">Ver</button>
          </div>
          {!hist.length ? <p className="text-sm text-gray-400">Elige un servicio y pulsa “Ver”.</p> : (
            <table className="w-full text-sm">
              <thead><tr className="text-left text-gray-400 text-xs uppercase"><th className="py-1">Versión</th><th>Quién</th><th>Cuándo</th><th>Motivo</th><th></th></tr></thead>
              <tbody>
                {hist.map((h) => (
                  <tr key={h.id} className="border-t border-gray-50">
                    <td className="py-2 font-bold text-gray-800">v{h.version}{h.active && <span className="ml-1 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">ACTIVA</span>}{h.rolledBackFrom && <span className="ml-1 text-[10px] text-gray-400">↩v{h.rolledBackFrom}</span>}</td>
                    <td className="text-gray-500">{h.publishedBy ?? '—'}</td>
                    <td className="text-gray-400 text-xs">{h.publishedAt ? h.publishedAt.slice(0, 10) : '—'}</td>
                    <td className="text-gray-500 text-xs max-w-[240px] truncate">{h.reason ?? '—'}</td>
                    <td className="text-right">{!h.active && <button onClick={() => rollback(histSvc, h.version)} disabled={busy} className="text-xs bg-amber-100 text-amber-800 px-2.5 py-1 rounded-lg font-bold disabled:opacity-50">Volver a esta</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
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
