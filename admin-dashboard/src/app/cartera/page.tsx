/**
 * Cartera Corporativa — cuentas por cobrar de TODAS las empresas cliente.
 *
 * Antes no existía forma de ver esto: la facturación corporativa tomaba el
 * companyId del token, así que cada quien solo veía la suya. Se agregó soporte
 * de `companyId` para admin de plataforma (honrado SOLO con rol admin), y esta
 * pantalla lo consume.
 *
 * Muestra por empresa: facturado, cobrado, por cobrar y vencido, y permite
 * emitir la factura del mes y marcarla pagada.
 */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMonorepoApp } from '@/lib/providers';
import { AdminLayout } from '../components';
import { adminFetch } from '../../lib/admin-api';

interface Factura {
  _id?: string;
  invoiceNumber?: string;
  companyId: string;
  month?: string;
  total?: number;
  currency?: string;
  status?: string;
  issuedAt?: string;
  dueDate?: string;
  paidAt?: string | null;
  tripCount?: number;
}

interface Empresa {
  id: string;
  name: string;
  tipoCuenta?: string;
  status?: string;
}

interface FilaCartera {
  empresa: Empresa;
  facturado: number;
  cobrado: number;
  porCobrar: number;
  vencido: number;
  facturas: Factura[];
  cargando?: boolean;
  error?: string;
}

const money = (n: number, c = 'USD') =>
  `${c} ${(n ?? 0).toLocaleString('es-EC', { minimumFractionDigits: 2 })}`;

const mesActual = () => new Date().toISOString().slice(0, 7);

const TIPO_LABEL: Record<string, string> = {
  grande: 'Empresa Grande',
  negocio: 'Negocio/PyME',
  agencia: 'Agencia',
};

export default function CarteraPage() {
  const { auth } = useMonorepoApp();
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? '' : '';
  const [filas, setFilas] = useState<FilaCartera[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accion, setAccion] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [mes, setMes] = useState(mesActual());
  const [soloDeuda, setSoloDeuda] = useState(false);

  const aviso = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  async function cargar() {
    if (!token) return;
    setCargando(true);
    setError(null);
    try {
      const res: any = await adminFetch('/corporate/companies?limit=200', token);
      const lista: Empresa[] = (res?.companies ?? res ?? []).filter(
        (c: any) => c?.id && c.status !== 'prospect',
      );

      // Cartera por empresa, en paralelo. Una empresa que falle no debe dejar
      // la tabla entera en blanco: se marca esa fila y las demás siguen.
      const resultados = await Promise.all(
        lista.map(async (empresa): Promise<FilaCartera> => {
          try {
            const inv: any = await adminFetch(
              `/corporate/billing/invoices?companyId=${encodeURIComponent(empresa.id)}`,
              token,
            );
            const facturas: Factura[] = Array.isArray(inv) ? inv : (inv?.invoices ?? []);
            const ahora = Date.now();
            let facturado = 0, cobrado = 0, porCobrar = 0, vencido = 0;
            for (const f of facturas) {
              const monto = Number(f.total) || 0;
              facturado += monto;
              const pagada = f.status === 'paid' || !!f.paidAt;
              if (pagada) cobrado += monto;
              else {
                porCobrar += monto;
                if (f.dueDate && new Date(f.dueDate).getTime() < ahora) vencido += monto;
              }
            }
            return { empresa, facturado, cobrado, porCobrar, vencido, facturas };
          } catch (e: any) {
            return {
              empresa, facturado: 0, cobrado: 0, porCobrar: 0, vencido: 0,
              facturas: [], error: e?.message ?? 'no se pudo cargar',
            };
          }
        }),
      );
      setFilas(resultados.sort((a, b) => b.porCobrar - a.porCobrar));
    } catch (e: any) {
      setError(e?.message ?? 'No se pudo cargar la cartera');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { if (auth.user && token) cargar(); /* eslint-disable-next-line */ }, [auth.user, token]);

  async function emitirFactura(companyId: string, nombre: string) {
    if (!token) return;
    setAccion(companyId);
    try {
      const r: any = await adminFetch('/corporate/billing/invoices/generate', token, {
        method: 'POST',
        body: JSON.stringify({ month: mes, companyId }),
      });
      aviso(
        r?.invoiceNumber
          ? `${nombre}: ${r.invoiceNumber} por ${money(r.total ?? 0)} (${r.tripCount ?? 0} viajes)`
          : `${nombre}: factura generada`,
        true,
      );
      await cargar();
    } catch (e: any) {
      // Sin viajes facturables el motor responde error: eso NO es un fallo del
      // sistema, es que no hay nada que cobrar ese mes.
      aviso(`${nombre}: ${e?.message ?? 'no se pudo emitir'}`, false);
    } finally {
      setAccion(null);
    }
  }

  async function marcarPagada(facturaId: string, nombre: string) {
    if (!token) return;
    setAccion(facturaId);
    try {
      await adminFetch(`/corporate/billing/invoices/${facturaId}/pay`, token, { method: 'PATCH' });
      aviso(`${nombre}: factura marcada como pagada`, true);
      await cargar();
    } catch (e: any) {
      aviso(`${nombre}: ${e?.message ?? 'no se pudo marcar'}`, false);
    } finally {
      setAccion(null);
    }
  }

  const visibles = useMemo(
    () => (soloDeuda ? filas.filter((f) => f.porCobrar > 0) : filas),
    [filas, soloDeuda],
  );

  const totales = useMemo(
    () =>
      filas.reduce(
        (a, f) => ({
          facturado: a.facturado + f.facturado,
          cobrado: a.cobrado + f.cobrado,
          porCobrar: a.porCobrar + f.porCobrar,
          vencido: a.vencido + f.vencido,
        }),
        { facturado: 0, cobrado: 0, porCobrar: 0, vencido: 0 },
      ),
    [filas],
  );

  return (
    <AdminLayout>
      <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cartera Corporativa</h1>
          <p className="text-slate-600 mt-1">
            Cuentas por cobrar de todas las empresas cliente
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="month"
            value={mes}
            onChange={(e) => setMes(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
            title="Mes a facturar"
          />
          <button
            onClick={cargar}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            ↺ Actualizar
          </button>
        </div>
      </div>

      {toast && (
        <div
          className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${
            toast.ok
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-amber-50 border border-amber-200 text-amber-800'
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Totales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total facturado', valor: totales.facturado, color: 'text-slate-900' },
          { label: 'Cobrado', valor: totales.cobrado, color: 'text-green-600' },
          { label: 'Por cobrar', valor: totales.porCobrar, color: 'text-blue-600' },
          { label: 'Vencido', valor: totales.vencido, color: totales.vencido > 0 ? 'text-red-600' : 'text-slate-400' },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{k.label}</p>
            <p className={`text-2xl font-bold mt-1 ${k.color}`}>{money(k.valor)}</p>
          </div>
        ))}
      </div>

      <label className="flex items-center gap-2 mb-3 cursor-pointer select-none w-fit">
        <input
          type="checkbox"
          checked={soloDeuda}
          onChange={(e) => setSoloDeuda(e.target.checked)}
          className="w-4 h-4 accent-blue-600"
        />
        <span className="text-sm text-slate-700">Solo empresas con saldo por cobrar</span>
      </label>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800 mb-4">
          {error}
        </div>
      )}

      {cargando && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-white rounded-lg border border-slate-200 animate-pulse" />
          ))}
        </div>
      )}

      {!cargando && visibles.length === 0 && !error && (
        <div className="bg-white rounded-lg border border-slate-200 p-10 text-center">
          <p className="text-slate-600 font-medium">
            {soloDeuda ? 'Ninguna empresa tiene saldo pendiente.' : 'No hay empresas activas.'}
          </p>
        </div>
      )}

      {!cargando && visibles.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Empresa</th>
                <th className="px-4 py-3 text-right">Facturado</th>
                <th className="px-4 py-3 text-right">Cobrado</th>
                <th className="px-4 py-3 text-right">Por cobrar</th>
                <th className="px-4 py-3 text-right">Vencido</th>
                <th className="px-4 py-3">Facturas</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibles.map((f) => {
                const pendiente = f.facturas.find((x) => x.status !== 'paid' && !x.paidAt);
                return (
                  <tr key={f.empresa.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{f.empresa.name}</p>
                      <p className="text-xs text-slate-500">
                        {TIPO_LABEL[f.empresa.tipoCuenta ?? ''] ?? f.empresa.tipoCuenta ?? '—'}
                      </p>
                      {f.error && (
                        <p className="text-xs text-red-600 mt-0.5">No se pudo cargar: {f.error}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">{money(f.facturado)}</td>
                    <td className="px-4 py-3 text-right text-green-700">{money(f.cobrado)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-blue-700">
                      {money(f.porCobrar)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-semibold ${
                        f.vencido > 0 ? 'text-red-600' : 'text-slate-400'
                      }`}
                    >
                      {f.vencido > 0 ? money(f.vencido) : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {f.facturas.length === 0 ? (
                        <span className="text-slate-400">sin facturas</span>
                      ) : (
                        f.facturas.slice(0, 2).map((x) => (
                          <div key={x._id ?? x.invoiceNumber}>
                            {x.invoiceNumber ?? x.month}{' '}
                            <span
                              className={
                                x.status === 'paid' || x.paidAt
                                  ? 'text-green-600'
                                  : x.dueDate && new Date(x.dueDate) < new Date()
                                  ? 'text-red-600'
                                  : 'text-slate-500'
                              }
                            >
                              ({x.status === 'paid' || x.paidAt ? 'pagada' : `vence ${(x.dueDate ?? '').slice(0, 10)}`})
                            </span>
                          </div>
                        ))
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => emitirFactura(f.empresa.id, f.empresa.name)}
                          disabled={accion === f.empresa.id}
                          className="px-2.5 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
                          title={`Emitir factura de ${mes}`}
                        >
                          {accion === f.empresa.id ? '…' : 'Facturar mes'}
                        </button>
                        {pendiente?._id && (
                          <button
                            onClick={() => marcarPagada(pendiente._id!, f.empresa.name)}
                            disabled={accion === pendiente._id}
                            className="px-2.5 py-1.5 border border-green-300 text-green-700 text-xs font-semibold rounded-lg hover:bg-green-50 disabled:opacity-50"
                          >
                            {accion === pendiente._id ? '…' : 'Marcar pagada'}
                          </button>
                        )}
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
