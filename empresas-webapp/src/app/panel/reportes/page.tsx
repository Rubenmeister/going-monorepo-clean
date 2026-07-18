/**
 * Página de Reportes (corporativa)
 * Ruta: /panel/reportes
 *
 * KPIs derivados de datos CORPORATIVOS (los mismos del dashboard) + generación
 * de reportes CSV del lado del cliente por rango de fechas.
 *
 * ⚠️ Antes esta página consultaba `/analytics/kpis/current` y `/analytics/reports`,
 * que son endpoints SOLO-ADMIN (RBAC). Para un usuario de empresa devolvían 401 y
 * `corpFetch`, al refrescar y fallar, BORRABA la sesión y redirigía a login: la
 * página "no abría" y encima deslogueaba. Ahora usa `/bookings/my` +
 * `/invoices/stats/summary` (scope corporativo) y arma los reportes en el cliente.
 */

"use client";

import { useEffect, useState } from "react";
import { useAuthRedirect } from "@/lib/auth";
import { fetchBookings, fetchInvoices, corpFetch } from "@/lib/api";

// ─── Export helpers ───────────────────────────────────────────────────────────

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob(["﻿" + content], { type: mime }); // BOM para UTF-8 en Excel
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function toCSV(rows: Record<string, any>[], cols: string[]): string {
  const header = cols.join(";");
  const body   = rows.map((r) => cols.map((c) => {
    const v = r[c] ?? "";
    return typeof v === "string" && (v.includes(";") || v.includes("\n")) ? `"${v.replace(/"/g, '""')}"` : v;
  }).join(";")).join("\n");
  return `${header}\n${body}`;
}

function fmtDateISO(s: string): string {
  try { return new Date(s).toLocaleDateString("es-EC"); } catch { return s; }
}

function fmtMoney(n: number) {
  return `$${(n ?? 0).toLocaleString("es-EC", { minimumFractionDigits: 2 })}`;
}

function todayStr()       { return new Date().toISOString().slice(0, 10); }
function firstOfMonthStr(){ const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10); }

function bookingAmount(b: any): number {
  return Number(b?.totalPrice?.amount ?? b?.total ?? 0) || 0;
}
function bookingDate(b: any): Date {
  return new Date(b?.startDate ?? b?.createdAt ?? 0);
}

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface KPIs {
  totalTrips: number;
  tripsThisMonth: number;
  completedTrips: number;
  pendingApprovals: number;
  billedAmount: number;
  outstandingAmount: number;
}

type ReportType = "TRIP" | "REVENUE" | "INVOICE";

const REPORT_TYPES: { value: ReportType; label: string; desc: string }[] = [
  { value: "TRIP",    label: "Viajes (detalle)",   desc: "Una fila por viaje en el rango" },
  { value: "REVENUE", label: "Ingresos (mensual)", desc: "Total gastado agrupado por mes" },
  { value: "INVOICE", label: "Facturas",           desc: "Facturas emitidas en el rango" },
];

// ─── KPI Card ────────────────────────────────────────────────────────────────

function KPICard({ label, value, sub, alert }: { label: string; value: string; sub?: string; alert?: boolean }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${alert ? "text-amber-600" : "text-slate-900"}`}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

// ─── Componente ──────────────────────────────────────────────────────────────

export default function ReportesPage() {
  const { session } = useAuthRedirect();

  const [kpis, setKpis]           = useState<KPIs | null>(null);
  const [kpisLoading, setKpisLoading] = useState(true);

  const [form, setForm] = useState<{ type: ReportType; startDate: string; endDate: string }>({
    type: "TRIP",
    startDate: firstOfMonthStr(),
    endDate: todayStr(),
  });
  const [generating, setGenerating] = useState(false);
  const [genError,   setGenError]   = useState<string | null>(null);
  const [genOk,      setGenOk]      = useState<string | null>(null);

  useEffect(() => {
    if (!session?.accessToken) return;
    let alive = true;
    (async () => {
      try {
        // Datos corporativos (scope propio). silent401 → si algo se restringe,
        // degradamos sin desloguear.
        const [bookings, invoiceStats] = await Promise.all([
          fetchBookings(session!.accessToken).catch(() => [] as any[]),
          corpFetch<any>("/invoices/stats/summary", session!.accessToken, { silent401: true }).catch(() => null),
        ]);

        const now = new Date();
        const m = now.getMonth(), y = now.getFullYear();
        let totalTrips = 0, tripsThisMonth = 0, completedTrips = 0, pendingApprovals = 0;
        (Array.isArray(bookings) ? bookings : []).forEach((b: any) => {
          totalTrips++;
          const d = bookingDate(b);
          if (d.getMonth() === m && d.getFullYear() === y) tripsThisMonth++;
          const st = String(b?.status ?? "").toLowerCase();
          if (st === "completed" || st === "confirmed") completedTrips++;
          if (st === "pending") pendingApprovals++;
        });

        const billedAmount      = Number(invoiceStats?.totalAmount ?? 0) || 0;
        const outstandingAmount = Number(invoiceStats?.dueAmount ?? 0) || 0;

        if (alive) setKpis({ totalTrips, tripsThisMonth, completedTrips, pendingApprovals, billedAmount, outstandingAmount });
      } catch {
        if (alive) setKpis({ totalTrips: 0, tripsThisMonth: 0, completedTrips: 0, pendingApprovals: 0, billedAmount: 0, outstandingAmount: 0 });
      } finally {
        if (alive) setKpisLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [session?.accessToken]);

  if (!session) return null;

  // ── Generar reporte (CSV, en el cliente) ─────────────────────────────────
  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setGenerating(true);
    setGenError(null);
    setGenOk(null);
    try {
      const from = new Date(form.startDate + "T00:00:00");
      const to   = new Date(form.endDate   + "T23:59:59");
      if (from > to) { setGenError("El rango de fechas es inválido (Desde es posterior a Hasta)."); return; }
      const tag = `${form.startDate}_${form.endDate}`;

      if (form.type === "TRIP" || form.type === "REVENUE") {
        const all = await fetchBookings(session!.accessToken);
        const inRange = (Array.isArray(all) ? all : []).filter((b: any) => {
          const d = bookingDate(b); return d >= from && d <= to;
        });
        if (inRange.length === 0) { setGenError("No hay viajes en ese rango de fechas."); return; }

        if (form.type === "TRIP") {
          const rows = inRange.map((b: any) => ({
            ID:        b.id ?? b._id ?? "",
            Servicio:  b.serviceType ?? "",
            Estado:    b.status ?? "",
            Origen:    b.metadata?.origin ?? "",
            Destino:   b.metadata?.destination ?? "",
            Monto:     bookingAmount(b).toFixed(2),
            Moneda:    b.totalPrice?.currency ?? "USD",
            Fecha:     b.startDate ? fmtDateISO(b.startDate) : "",
            Creado:    b.createdAt ? fmtDateISO(b.createdAt) : "",
            Solicitante: b.metadata?.requesterName ?? "",
          }));
          downloadBlob(toCSV(rows, ["ID","Servicio","Estado","Origen","Destino","Monto","Moneda","Fecha","Creado","Solicitante"]),
            `going_viajes_${tag}.csv`, "text/csv;charset=utf-8");
          setGenOk(`Reporte de ${rows.length} viaje(s) descargado.`);
        } else {
          // Ingresos agrupados por mes (YYYY-MM)
          const byMonth = new Map<string, { total: number; count: number }>();
          inRange.forEach((b: any) => {
            const d = bookingDate(b);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            const cur = byMonth.get(key) ?? { total: 0, count: 0 };
            cur.total += bookingAmount(b); cur.count++;
            byMonth.set(key, cur);
          });
          const rows = Array.from(byMonth.entries()).sort().map(([mes, v]) => ({
            Mes: mes, Viajes: v.count, Total: v.total.toFixed(2), Moneda: "USD",
          }));
          downloadBlob(toCSV(rows, ["Mes","Viajes","Total","Moneda"]),
            `going_ingresos_${tag}.csv`, "text/csv;charset=utf-8");
          setGenOk(`Reporte de ingresos (${rows.length} mes/es) descargado.`);
        }
      } else {
        // Facturas — endpoint corporativo /invoices
        const res = await fetchInvoices(session!.accessToken, { limit: 500 });
        const inRange = (res?.invoices ?? []).filter((inv: any) => {
          const d = new Date(inv.issuedAt ?? inv.createdAt ?? inv.date ?? 0);
          return d >= from && d <= to;
        });
        if (inRange.length === 0) { setGenError("No hay facturas en ese rango de fechas."); return; }
        const rows = inRange.map((inv: any) => ({
          Numero:  inv.invoiceNumber ?? inv.number ?? inv.id ?? "",
          Estado:  inv.status ?? inv.paymentStatus ?? "",
          Total:   Number(inv.totalAmount ?? inv.amount ?? 0).toFixed(2),
          Moneda:  inv.currency ?? "USD",
          Emitida: inv.issuedAt ? fmtDateISO(inv.issuedAt) : (inv.createdAt ? fmtDateISO(inv.createdAt) : ""),
          Vence:   inv.dueDate ? fmtDateISO(inv.dueDate) : "",
        }));
        downloadBlob(toCSV(rows, ["Numero","Estado","Total","Moneda","Emitida","Vence"]),
          `going_facturas_${tag}.csv`, "text/csv;charset=utf-8");
        setGenOk(`Reporte de ${rows.length} factura(s) descargado.`);
      }
    } catch {
      setGenError("No se pudo generar el reporte. Verifica tu conexión e intenta de nuevo.");
    } finally {
      setGenerating(false);
    }
  }

  const kpiN = (n?: number) => (n == null ? "—" : String(n));

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Reportes</h1>
        <p className="text-slate-600 mt-1">Indicadores de tu empresa y exportación de reportes</p>
      </div>

      {/* KPIs */}
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Indicadores</h2>
      {kpisLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {[1,2,3,4,5,6].map((i) => (
            <div key={i} className="h-24 bg-white rounded-lg border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <KPICard label="Viajes Totales"        value={kpiN(kpis?.totalTrips)}     sub="histórico" />
          <KPICard label="Viajes Este Mes"       value={kpiN(kpis?.tripsThisMonth)} sub="del mes en curso" />
          <KPICard label="Viajes Completados"    value={kpiN(kpis?.completedTrips)} sub="confirmados / completados" />
          <KPICard label="Pendientes Aprobación" value={kpiN(kpis?.pendingApprovals)} sub="requieren atención" alert={!!kpis?.pendingApprovals} />
          <KPICard label="Total Facturado"       value={kpis ? fmtMoney(kpis.billedAmount) : "—"} sub="acumulado" />
          <KPICard label="Saldo Pendiente"       value={kpis ? fmtMoney(kpis.outstandingAmount) : "—"} sub="por pagar" alert={!!kpis?.outstandingAmount} />
        </div>
      )}

      {/* Generador de reportes CSV */}
      <div className="max-w-xl bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900 mb-1">Generar reporte</h2>
        <p className="text-sm text-slate-500 mb-4">Descarga un CSV (se abre en Excel/Sheets) con los datos del período elegido.</p>
        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Tipo de reporte</label>
            <div className="space-y-2">
              {REPORT_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setForm({ ...form, type: t.value })}
                  className={`w-full text-left px-3 py-2.5 rounded-lg border transition-colors ${
                    form.type === t.value ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <p className={`text-sm font-semibold ${form.type === t.value ? "text-blue-700" : "text-slate-800"}`}>{t.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Desde</label>
              <input type="date" value={form.startDate} max={form.endDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })} required
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Hasta</label>
              <input type="date" value={form.endDate} min={form.startDate} max={todayStr()}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })} required
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {genError && (
            <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{genError}</p>
          )}
          {genOk && (
            <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">✓ {genOk}</p>
          )}

          <button type="submit" disabled={generating}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {generating ? "Generando…" : "Descargar CSV"}
          </button>
        </form>
      </div>
    </div>
  );
}
