/**
 * Página de Reportes
 * Ruta: /reportes
 *
 * KPIs en tiempo real + historial de reportes generados + generador de nuevos reportes.
 */

"use client";

import { useEffect, useState } from "react";
import { useAuthRedirect } from "@/lib/auth";
import { corpFetch, fetchBookings } from "@/lib/api";

// ─── Export helpers ───────────────────────────────────────────────────────────

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob(["\uFEFF" + content], { type: mime }); // BOM para UTF-8 en Excel
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function toCSV(rows: Record<string, any>[], cols: string[]): string {
  const header = cols.join(";");
  const body   = rows.map((r) => cols.map((c) => {
    const v = r[c] ?? "";
    return typeof v === "string" && v.includes(";") ? `"${v}"` : v;
  }).join(";")).join("\n");
  return `${header}\n${body}`;
}

function formatISO(s: string): string {
  try { return new Date(s).toLocaleDateString("es-EC"); } catch { return s; }
}

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface KPIs {
  totalTrips: number;
  activeDrivers: number;
  totalRevenueThisMonth: number;
  totalRevenueThisYear: number;
  outstandingAmount: number;
  totalInvoicesIssued: number;
  totalInvoicesOverdue: number;
  notificationDeliveryRate: number;
}

interface Report {
  id?: string;
  type: string;
  title: string;
  status: "GENERATING" | "COMPLETED" | "FAILED";
  format: string;
  startDate: string;
  endDate: string;
  totalRecords: number;
  fileUrl?: string;
  createdAt: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const REPORT_TYPES = [
  { value: "TRIP_REPORT",          label: "Reporte de Viajes" },
  { value: "INVOICE_REPORT",       label: "Reporte de Facturas" },
  { value: "REVENUE_REPORT",       label: "Reporte de Ingresos" },
  { value: "DRIVER_PERFORMANCE",   label: "Rendimiento de Conductores" },
  { value: "COMPLIANCE_REPORT",    label: "Cumplimiento" },
];

const FORMATS = ["PDF", "XLSX", "CSV"];

const STATUS_STYLES: Record<string, string> = {
  COMPLETED:  "bg-green-100 text-green-700",
  GENERATING: "bg-yellow-100 text-yellow-700",
  FAILED:     "bg-red-100 text-red-700",
};

function fmtMoney(n: number) {
  return `$${n.toLocaleString("es-EC", { minimumFractionDigits: 2 })}`;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("es-EC", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function firstOfMonthStr() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

// ─── KPI Card ────────────────────────────────────────────────────────────────

function KPICard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

// ─── Componente ──────────────────────────────────────────────────────────────

export default function ReportesPage() {
  const { session } = useAuthRedirect();

  // KPIs
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [kpisLoading, setKpisLoading] = useState(true);

  // Reportes
  const [reports, setReports] = useState<Report[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);

  // Generador
  const [form, setForm] = useState({
    type: "TRIP_REPORT",
    startDate: firstOfMonthStr(),
    endDate: todayStr(),
    format: "PDF",
  });
  const [generating,   setGenerating]   = useState(false);
  const [genError,     setGenError]     = useState<string | null>(null);
  const [genOk,        setGenOk]        = useState(false);
  const [exporting,    setExporting]    = useState<"bookings" | "kpis" | null>(null);

  useEffect(() => {
    if (!session?.accessToken) return;

    // Cargar KPIs
    corpFetch<KPIs>("/analytics/kpis/current", session!.accessToken)
      .then(setKpis)
      .catch(() => {/* silencioso, mostramos "—" */})
      .finally(() => setKpisLoading(false));

    // Cargar reportes existentes
    corpFetch<{ reports: Report[] }>("/analytics/reports?limit=20", session!.accessToken)
      .then((res) => setReports(res?.reports ?? []))
      .catch(() => {})
      .finally(() => setReportsLoading(false));
  }, [session?.accessToken]);

  if (!session) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setGenError(null);
    setGenOk(false);
    try {
      const report = await corpFetch<Report>("/analytics/reports", session!.accessToken!, {
        method: "POST",
        body: JSON.stringify(form),
      });
      setReports((prev) => [report, ...prev]);
      setGenOk(true);
      setTimeout(() => setGenOk(false), 4000);
    } catch {
      setGenError("No se pudo generar el reporte. Intenta de nuevo.");
    } finally {
      setGenerating(false);
    }
  };

  const kpiFmt = (n?: number) => (n == null ? "—" : String(n));

  // ── Exportar bookings del mes como CSV ───────────────────────────────────
  async function handleExportBookings() {
    setExporting("bookings");
    try {
      const bookings = await fetchBookings(session!.accessToken);
      const rows = bookings.map((b: any) => ({
        ID:          b.id ?? "",
        Servicio:    b.serviceType ?? "",
        Estado:      b.status ?? "",
        Total:       b.totalPrice?.amount ?? b.total ?? "",
        Moneda:      b.totalPrice?.currency ?? b.currency ?? "USD",
        Inicio:      b.startDate ? formatISO(b.startDate) : "",
        Creado:      b.createdAt ? formatISO(b.createdAt) : "",
        Notas:       b.notes ?? "",
      }));
      const csv = toCSV(rows, ["ID","Servicio","Estado","Total","Moneda","Inicio","Creado","Notas"]);
      const month = new Date().toISOString().slice(0,7);
      downloadBlob(csv, `going_viajes_${month}.csv`, "text/csv;charset=utf-8");
    } catch {/* silencioso */}
    finally { setExporting(null); }
  }

  // ── Exportar KPIs actuales como CSV ──────────────────────────────────────
  function handleExportKPIs() {
    if (!kpis) return;
    setExporting("kpis");
    const rows = [
      { Indicador: "Viajes Totales",            Valor: kpis.totalTrips },
      { Indicador: "Ingresos Este Mes (USD)",   Valor: kpis.totalRevenueThisMonth },
      { Indicador: "Ingresos Este Año (USD)",   Valor: kpis.totalRevenueThisYear },
      { Indicador: "Saldo Pendiente (USD)",     Valor: kpis.outstandingAmount },
      { Indicador: "Facturas Emitidas",         Valor: kpis.totalInvoicesIssued },
      { Indicador: "Facturas Vencidas",         Valor: kpis.totalInvoicesOverdue },
      { Indicador: "Conductores Activos",       Valor: kpis.activeDrivers },
      { Indicador: "Entrega Notificaciones (%)",Valor: kpis.notificationDeliveryRate },
    ];
    const csv = toCSV(rows, ["Indicador","Valor"]);
    const date = new Date().toISOString().slice(0,10);
    downloadBlob(csv, `going_kpis_${date}.csv`, "text/csv;charset=utf-8");
    setExporting(null);
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Reportes</h1>
          <p className="text-slate-600 mt-1">KPIs en tiempo real y generación de reportes</p>
        </div>
        {/* Exportar rápido */}
        <div className="flex gap-2">
          <button
            onClick={handleExportKPIs}
            disabled={!kpis || exporting === "kpis"}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40 flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {exporting === "kpis" ? "Exportando…" : "KPIs CSV"}
          </button>
          <button
            onClick={handleExportBookings}
            disabled={exporting === "bookings"}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40 flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {exporting === "bookings" ? "Exportando…" : "Viajes CSV"}
          </button>
        </div>
      </div>

      {/* KPIs */}
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
        KPIs Actuales
      </h2>
      {kpisLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[1,2,3,4].map((i) => (
            <div key={i} className="h-20 bg-white rounded-lg border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <KPICard label="Viajes Totales"        value={kpiFmt(kpis?.totalTrips)}            sub="acumulado" />
          <KPICard label="Ingresos Este Mes"     value={kpis ? fmtMoney(kpis.totalRevenueThisMonth) : "—"} />
          <KPICard label="Ingresos Este Año"     value={kpis ? fmtMoney(kpis.totalRevenueThisYear)  : "—"} />
          <KPICard label="Saldo Pendiente"       value={kpis ? fmtMoney(kpis.outstandingAmount)     : "—"} sub="por cobrar" />
          <KPICard label="Facturas Emitidas"     value={kpiFmt(kpis?.totalInvoicesIssued)} />
          <KPICard label="Facturas Vencidas"     value={kpiFmt(kpis?.totalInvoicesOverdue)} sub={kpis?.totalInvoicesOverdue ? "⚠ Requieren atención" : undefined} />
          <KPICard label="Conductores Activos"   value={kpiFmt(kpis?.activeDrivers)} />
          <KPICard label="Entrega Notificaciones" value={kpis ? `${kpis.notificationDeliveryRate?.toFixed(1)}%` : "—"} />
        </div>
      )}

      {/* Generador + Historial */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Generador */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 p-6 shadow-sm h-fit">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Generar Nuevo Reporte</h2>
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {REPORT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Desde</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Hasta</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Formato</label>
              <div className="flex gap-2">
                {FORMATS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setForm({ ...form, format: f })}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${
                      form.format === f
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {genError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {genError}
              </p>
            )}
            {genOk && (
              <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                ✓ Reporte generado y añadido al historial.
              </p>
            )}

            <button
              type="submit"
              disabled={generating}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
            >
              {generating ? "Generando..." : "Generar Reporte"}
            </button>
          </form>
        </div>

        {/* Historial */}
        <div className="lg:col-span-3">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Historial de Reportes
          </h2>

          {reportsLoading && (
            <div className="space-y-3">
              {[1,2,3].map((i) => (
                <div key={i} className="h-16 bg-white rounded-lg border border-slate-200 animate-pulse" />
              ))}
            </div>
          )}

          {!reportsLoading && reports.length === 0 && (
            <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
              <p className="text-slate-500 text-sm">No hay reportes generados aún.</p>
            </div>
          )}

          {!reportsLoading && reports.length > 0 && (
            <div className="space-y-3">
              {reports.map((r, i) => (
                <div
                  key={r.id ?? i}
                  className="bg-white rounded-lg border border-slate-200 px-5 py-4 shadow-sm flex items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-slate-900 truncate">
                        {r.title ?? REPORT_TYPES.find((t) => t.value === r.type)?.label ?? r.type}
                      </span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full shrink-0 ${STATUS_STYLES[r.status] ?? "bg-slate-100 text-slate-600"}`}>
                        {r.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {fmtDate(r.startDate)} → {fmtDate(r.endDate)} ·{" "}
                      {r.format} · {r.totalRecords ?? 0} registros
                    </p>
                  </div>
                  {r.status === "COMPLETED" && r.fileUrl && (
                    <a
                      href={r.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 px-3 py-1.5 text-xs font-semibold text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      Descargar
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
