'use client';
export const dynamic = 'force-dynamic';

/**
 * Tarifas corporativas negociadas — recargo por empresa y por servicio.
 *
 * El precio corporativo es el privado MÁS un recargo. Ese recargo se negocia con
 * cada empresa y puede ser distinto por servicio (transporte 18%, tours 30%…).
 *
 * Esta pantalla es de STAFF GOING, no de la empresa: si una empresa pudiera
 * fijar su propio recargo se pondría 0% y el modelo corporativo dejaría de
 * existir. El endpoint exige rol admin y recibe el companyId en la ruta.
 */

import { useEffect, useState, useCallback } from 'react';
import { useMonorepoApp } from '@/lib/providers';
import { AdminLayout } from '../components';
import { Loading } from '@/lib/shared-ui';
import { API } from '../../lib/admin-api';

async function req<T>(token: string, path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(opts?.headers ?? {}) },
  });
  if (!res.ok) {
    const detalle = await res.text().catch(() => '');
    throw new Error(detalle || `Error ${res.status}`);
  }
  return res.json();
}

const SERVICIOS = [
  { key: 'transport', label: 'Transporte', icon: '🚗' },
  { key: 'parcel', label: 'Envíos', icon: '📦' },
  { key: 'tour', label: 'Tours', icon: '🗺️' },
  { key: 'accommodation', label: 'Alojamiento', icon: '🏨' },
  { key: 'experience', label: 'Experiencias', icon: '🎭' },
];

interface Empresa {
  companyId: string;
  companyName?: string;
  razonSocial?: string;
  tipoCuenta?: string;
}

interface Recargos {
  companyId: string;
  rates: Record<string, number>;
  efectivo: Record<string, number>;
  porDefectoDelSistema: number;
}

/** Fracción (0.18) → texto de porcentaje ("18"). */
const aPct = (v: number | undefined | null) =>
  v === undefined || v === null || Number.isNaN(v) ? '' : String(Math.round(v * 1000) / 10);

export default function TarifasCorporativasPage() {
  const { auth } = useMonorepoApp();
  // Mismo origen del token que el resto del panel de administración.
  const token: string =
    typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? '' : '';

  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [sel, setSel] = useState<string>('');
  const [datos, setDatos] = useState<Recargos | null>(null);
  const [edicion, setEdicion] = useState<Record<string, string>>({});
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const r = await req<any>(token, '/corporate/companies?limit=200');
        // Mismo desempaquetado que la pantalla de Empresas, que ya está probado:
        // la respuesta llega como array suelto, {companies} o {data} según el caso.
        const crudas: any[] = Array.isArray(r) ? r : r?.companies ?? r?.data ?? [];
        const lista: Empresa[] = crudas
          .map((c: any) => ({
            companyId: c.id ?? c._id ?? c.companyId ?? '',
            companyName: c.name ?? c.companyName ?? c.razonSocial ?? undefined,
            tipoCuenta: c.tipoCuenta ?? c.accountType,
          }))
          .filter((c) => c.companyId);
        setEmpresas(lista);
        if (lista.length) setSel(lista[0].companyId);
      } catch (e: any) {
        setError(`No se pudo cargar la lista de empresas: ${e.message}`);
      } finally {
        setCargando(false);
      }
    })();
  }, [token]);

  const cargarRecargos = useCallback(async () => {
    if (!token || !sel) return;
    setError(null);
    setOk(null);
    try {
      const r = await req<Recargos>(token, `/corporate/surcharge-rates/${sel}`);
      setDatos(r);
      const e: Record<string, string> = { default: aPct(r.rates?.default) };
      for (const s of SERVICIOS) e[s.key] = aPct(r.rates?.[s.key]);
      setEdicion(e);
    } catch (e: any) {
      setError(`No se pudieron cargar las tasas: ${e.message}`);
      setDatos(null);
    }
  }, [token, sel]);

  useEffect(() => { void cargarRecargos(); }, [cargarRecargos]);

  async function guardar() {
    if (!token || !sel) return;
    setGuardando(true);
    setError(null);
    setOk(null);
    try {
      // Solo se envían los campos con valor: dejar uno vacío significa "sin tasa
      // propia", y entonces rige el `default` de la empresa o el estándar.
      const rates: Record<string, number> = {};
      for (const [k, v] of Object.entries(edicion)) {
        const t = String(v).trim().replace(',', '.');
        if (t === '') continue;
        const n = Number(t);
        if (Number.isNaN(n)) throw new Error(`"${t}" no es un número válido.`);
        rates[k] = n / 100; // el servidor guarda fracción
      }
      const r = await req<Recargos>(token, `/corporate/surcharge-rates/${sel}`, {
        method: 'PUT',
        body: JSON.stringify({ rates }),
      });
      setDatos(r);
      setOk('Tasas guardadas. Aplican a las próximas cotizaciones y reservas.');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  }

  const empresa = empresas.find((e) => e.companyId === sel);

  return (
    <AdminLayout userName={auth.user?.firstName ?? 'Admin'} onLogout={auth.logout}>
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold text-slate-900">Tarifas corporativas</h1>
        <p className="text-sm text-slate-500 mt-1">
          Recargo sobre el precio privado, negociado con cada empresa. Puede ser
          distinto por servicio.
        </p>

        {cargando ? (
          <Loading />
        ) : (
          <>
            <div className="mt-6">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                Empresa
              </label>
              <select
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                value={sel}
                onChange={(e) => setSel(e.target.value)}
              >
                {empresas.map((e) => (
                  <option key={e.companyId} value={e.companyId}>
                    {e.companyName ?? e.companyId}
                    {e.tipoCuenta ? ` · ${e.tipoCuenta}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {datos && (
              <div className="mt-6 bg-white border border-slate-200 rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                  <p className="text-sm font-semibold text-slate-800">
                    {empresa?.companyName ?? sel}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Deja un campo vacío para que ese servicio use el general. Sin
                    nada configurado rige el {Math.round(datos.porDefectoDelSistema * 100)}%
                    estándar.
                  </p>
                </div>

                <div className="divide-y divide-slate-100">
                  <FilaTasa
                    icono="⚙️"
                    label="General (todos los servicios)"
                    valor={edicion.default ?? ''}
                    onChange={(v) => setEdicion({ ...edicion, default: v })}
                    efectivo={null}
                  />
                  {SERVICIOS.map((s) => (
                    <FilaTasa
                      key={s.key}
                      icono={s.icon}
                      label={s.label}
                      valor={edicion[s.key] ?? ''}
                      onChange={(v) => setEdicion({ ...edicion, [s.key]: v })}
                      efectivo={datos.efectivo?.[s.key] ?? null}
                    />
                  ))}
                </div>

                <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center gap-3">
                  <button
                    onClick={guardar}
                    disabled={guardando}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
                  >
                    {guardando ? 'Guardando…' : 'Guardar tasas'}
                  </button>
                  <button
                    onClick={() => void cargarRecargos()}
                    className="px-3 py-2 text-sm text-slate-600 hover:text-slate-900"
                  >
                    Descartar cambios
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
            {ok && (
              <div className="mt-4 px-4 py-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">{ok}</p>
              </div>
            )}

            <p className="mt-6 text-xs text-slate-400 leading-relaxed">
              El precio corporativo se calcula al cotizar: tarifa privada × (1 +
              recargo). No existe una tabla de precios corporativos aparte, así que
              cambiar un precio privado actualiza el corporativo automáticamente.
            </p>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

function FilaTasa({
  icono, label, valor, onChange, efectivo,
}: {
  icono: string;
  label: string;
  valor: string;
  onChange: (v: string) => void;
  /** Lo que se cobra HOY en este servicio, ya resuelta la cascada. */
  efectivo: number | null;
}) {
  return (
    <div className="px-4 py-3 flex items-center gap-4">
      <span className="text-lg w-6 text-center">{icono}</span>
      <span className="flex-1 text-sm text-slate-700">{label}</span>
      {efectivo !== null && (
        <span className="text-xs text-slate-400 tabular-nums">
          hoy: +{Math.round(efectivo * 1000) / 10}%
        </span>
      )}
      <div className="flex items-center gap-1.5">
        <input
          type="text"
          inputMode="decimal"
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          placeholder="—"
          className="w-20 px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm text-right tabular-nums"
        />
        <span className="text-sm text-slate-500 w-4">%</span>
      </div>
    </div>
  );
}
