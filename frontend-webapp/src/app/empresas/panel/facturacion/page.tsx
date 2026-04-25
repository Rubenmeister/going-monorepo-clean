/**
 * Página de Facturación
 * Ruta: /empresas/facturacion
 */

"use client";

import { useEffect, useState } from "react";
import { useAuthRedirect } from "@/lib/empresas/auth";
import { fetchInvoices } from "@/lib/empresas/api";
import { getContexto } from "@/lib/empresas/permisos";

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;           // DRAFT | ISSUED | SENT | PAID | OVERDUE | CANCELLED
  paymentStatus: string;    // PENDING | PARTIAL | PAID | REFUNDED
  total: number;
  amountDue?: number;
  amountPaid?: number;
  currency: string;
  issuedDate: string;
  dueDate: string;
  client: { name: string; email: string };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  DRAFT:      "bg-slate-100 text-slate-600",
  ISSUED:     "bg-blue-100 text-blue-700",
  SENT:       "bg-indigo-100 text-indigo-700",
  PAID:       "bg-green-100 text-green-700",
  OVERDUE:    "bg-red-100 text-red-700",
  CANCELLED:  "bg-slate-100 text-slate-500",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT:     "Borrador",
  ISSUED:    "Emitida",
  SENT:      "Enviada",
  PAID:      "Pagada",
  OVERDUE:   "Vencida",
  CANCELLED: "Cancelada",
};

const PAY_STYLES: Record<string, string> = {
  PENDING: "text-amber-600",
  PARTIAL: "text-blue-600",
  PAID:    "text-green-600",
  REFUNDED:"text-slate-500",
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("es-EC", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function fmtMoney(n: number, currency = "USD") {
  return `${currency} ${n.toLocaleString("es-EC", { minimumFractionDigits: 2 })}`;
}

const PAGE_SIZE = 20;

type StatusFilter = "ALL" | "ISSUED" | "SENT" | "PAID" | "OVERDUE" | "DRAFT";

const FILTERS: { label: string; value: StatusFilter }[] = [
  { label: "Todas",    value: "ALL" },
  { label: "Emitidas", value: "ISSUED" },
  { label: "Enviadas", value: "SENT" },
  { label: "Pagadas",  value: "PAID" },
  { label: "Vencidas", value: "OVERDUE" },
  { label: "Borrador", value: "DRAFT" },
];

// ─── Componente ──────────────────────────────────────────────────────────────

export default function FacturacionPage() {
  const { session } = useAuthRedirect();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("ALL");
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (!session?.accessToken) return;
    setLoading(true);
    setError(null);
    fetchInvoices(session!.accessToken, {
      status: filter === "ALL" ? undefined : filter,
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
    })
      .then((res) => {
        setInvoices(res.invoices ?? []);
        setTotal(res.total ?? 0);
      })
      .catch(() => setError("No se pudieron cargar las facturas."))
      .finally(() => setLoading(false));
  }, [session?.accessToken, filter, page]);

  // Al cambiar filtro, reset página
  const handleFilter = (f: StatusFilter) => {
    setFilter(f);
    setPage(0);
  };

  if (!session) return null;

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const tipoCuenta = session!.user.tipoCuenta as string | undefined;
  const ctx = getContexto(tipoCuenta);

  // Labels contextuales
  const titulo = ctx.labelFacturacion;
  const subtitulo = tipoCuenta === "agencia"
    ? "Comisiones generadas · Cobro a 15 días · 10% sobre viajes gestionados"
    : tipoCuenta === "grande"
    ? "Facturas con crédito a 40 días"
    : "Historial de facturas · Pago inmediato por viaje";

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">{titulo}</h1>
        <p className="text-slate-600 mt-1">{subtitulo}
        </p>
      </div>

      {/* Banner agencia */}
      {tipoCuenta === "agencia" && (
        <div className="mb-5 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
          Tu comisión es del <strong>10%</strong> sobre el valor de cada viaje gestionado. Se liquida a <strong>15 días</strong> de la fecha de servicio.
        </div>
      )}

      {/* Banner grande */}
      {tipoCuenta === "grande" && (
        <div className="mb-5 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700">
          Plazo de pago: <strong>40 días</strong> desde la fecha de emisión de cada factura.
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => handleFilter(f.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f.value
                ? "bg-blue-600 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-800 text-sm">
          {error}
        </div>
      )}

      {/* Skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-white rounded-lg border border-slate-200 animate-pulse" />
          ))}
        </div>
      )}

      {/* Vacío */}
      {!loading && !error && invoices.length === 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
          <p className="text-slate-500">No hay facturas {filter !== "ALL" ? `con estado "${STATUS_LABELS[filter]}"` : "registradas"}.</p>
        </div>
      )}

      {/* Tabla */}
      {!loading && !error && invoices.length > 0 && (
        <>
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
            {/* Header tabla */}
            <div className="grid grid-cols-12 px-5 py-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              <div className="col-span-2">N° Factura</div>
              <div className="col-span-3">Cliente</div>
              <div className="col-span-2">Emisión</div>
              <div className="col-span-2">Vence</div>
              <div className="col-span-1">Estado</div>
              <div className="col-span-2 text-right">Total</div>
            </div>

            {/* Filas */}
            {invoices.map((inv, i) => (
              <div
                key={inv.id}
                className={`grid grid-cols-12 px-5 py-4 items-center gap-2 text-sm ${
                  i !== invoices.length - 1 ? "border-b border-slate-100" : ""
                } hover:bg-slate-50 transition-colors`}
              >
                <div className="col-span-2 font-mono text-xs text-slate-700 font-semibold">
                  {inv.invoiceNumber}
                </div>
                <div className="col-span-3 min-w-0">
                  <p className="text-slate-900 font-medium truncate">{inv.client?.name ?? "—"}</p>
                  <p className="text-xs text-slate-500 truncate">{inv.client?.email ?? ""}</p>
                </div>
                <div className="col-span-2 text-slate-600 text-xs">
                  {inv.issuedDate ? fmtDate(inv.issuedDate) : "—"}
                </div>
                <div className="col-span-2 text-xs">
                  <span className={inv.status === "OVERDUE" ? "text-red-600 font-semibold" : "text-slate-600"}>
                    {inv.dueDate ? fmtDate(inv.dueDate) : "—"}
                  </span>
                </div>
                <div className="col-span-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[inv.status] ?? "bg-slate-100 text-slate-600"}`}>
                    {STATUS_LABELS[inv.status] ?? inv.status}
                  </span>
                </div>
                <div className="col-span-2 text-right">
                  <p className="font-bold text-slate-900">{fmtMoney(inv.total, inv.currency)}</p>
                  {inv.amountDue != null && inv.amountDue > 0 && inv.status !== "PAID" && (
                    <p className={`text-xs ${PAY_STYLES[inv.paymentStatus] ?? "text-slate-500"}`}>
                      Por pagar: {fmtMoney(inv.amountDue, inv.currency)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Footer: total + paginación */}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              {total} factura{total !== 1 ? "s" : ""} en total ·{" "}
              <span className="font-semibold text-slate-900">
                {fmtMoney(invoices.reduce((s, inv) => s + inv.total, 0))} en esta página
              </span>
            </p>

            {totalPages > 1 && (
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors"
                >
                  ← Anterior
                </button>
                <span className="text-sm text-slate-600">
                  {page + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors"
                >
                  Siguiente →
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
