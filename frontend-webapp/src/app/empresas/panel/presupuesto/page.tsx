/**
 * Página de Presupuesto por Departamento
 * Ruta: /empresas/presupuesto
 *
 * Solo visible para roles admin y financiero.
 * Muestra el consumo mensual por área vs. límite configurado.
 * Alerta visual al 80% del límite, rojo al 100%.
 */

"use client";

import { useEffect, useState } from "react";
import { useAuthRedirect } from "@/lib/empresas/auth";
import {
  fetchSpendingLimits,
  fetchSpendingReport,
  setDepartmentLimit,
  DepartmentLimit,
  DepartmentSpending,
} from "@/lib/empresas/api";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtMoney(n: number) {
  return "$" + n.toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7); // "YYYY-MM"
}

function monthLabel(ym: string): string {
  const [y, m] = ym.split("-");
  return new Date(+y, +m - 1).toLocaleDateString("es-EC", { month: "long", year: "numeric" });
}

interface BarProps { pct: number }
function SpendBar({ pct }: BarProps) {
  const clamped = Math.min(pct, 100);
  const color =
    clamped >= 100 ? "bg-red-500" :
    clamped >= 80  ? "bg-amber-400" :
    "bg-blue-500";
  return (
    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
      <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${clamped}%` }} />
    </div>
  );
}

// ─── Componente modal de edición ──────────────────────────────────────────────

interface EditModalProps {
  initial?: { department: string; monthlyLimit: number; dailyLimit?: number };
  onSave: (d: string, monthly: number, daily?: number) => void;
  onClose: () => void;
  saving: boolean;
}

function EditModal({ initial, onSave, onClose, saving }: EditModalProps) {
  const [dept,    setDept]    = useState(initial?.department ?? "");
  const [monthly, setMonthly] = useState(String(initial?.monthlyLimit ?? ""));
  const [daily,   setDaily]   = useState(String(initial?.dailyLimit ?? ""));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
        <h3 className="text-base font-bold text-slate-900 mb-4">
          {initial ? "Editar límite" : "Nuevo límite de departamento"}
        </h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Departamento *</label>
            <input
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={dept} onChange={(e) => setDept(e.target.value)}
              placeholder="Ej: Ventas, RRHH, Operaciones…"
              disabled={!!initial}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Límite mensual (USD) *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
              <input type="number" min="0" step="0.01"
                className="w-full border border-slate-200 rounded-lg pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={monthly} onChange={(e) => setMonthly(e.target.value)} placeholder="0.00" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Límite diario (USD) — opcional</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
              <input type="number" min="0" step="0.01"
                className="w-full border border-slate-200 rounded-lg pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={daily} onChange={(e) => setDaily(e.target.value)} placeholder="Sin límite diario" />
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50">
            Cancelar
          </button>
          <button
            onClick={() => onSave(dept.trim(), parseFloat(monthly) || 0, daily ? parseFloat(daily) : undefined)}
            disabled={saving || !dept.trim() || !monthly}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function PresupuestoPage() {
  const { session } = useAuthRedirect();

  const [month, setMonth]           = useState(currentMonth());
  const [limits, setLimits]         = useState<DepartmentLimit[]>([]);
  const [spending, setSpending]     = useState<Record<string, { amount: number; currency: string }>>({});
  const [totalSpent, setTotalSpent] = useState(0);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  const [showModal, setShowModal]   = useState(false);
  const [editTarget, setEditTarget] = useState<DepartmentLimit | null>(null);
  const [saving, setSaving]         = useState(false);
  const [saveError, setSaveError]   = useState<string | null>(null);

  const isAdmin = session?.user.roles.includes("admin") ?? false;
  const isFinanciero = session?.user.roles.includes("financiero") ?? false;
  const canEdit = isAdmin;

  const companyId = session?.user.companyId;
  const accessToken = session?.accessToken ?? "";

  // ── Carga datos ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!accessToken || !companyId) return;
    setLoading(true);
    setError(null);

    Promise.allSettled([
      fetchSpendingLimits(accessToken, companyId),
      fetchSpendingReport(accessToken, companyId, month),
    ]).then(([limitsRes, reportRes]) => {
      if (limitsRes.status === "fulfilled") setLimits(limitsRes.value);
      if (reportRes.status === "fulfilled") {
        setSpending(reportRes.value.byDepartment ?? {});
        setTotalSpent(reportRes.value.totalSpent?.amount ?? 0);
      }
      if (limitsRes.status === "rejected" && reportRes.status === "rejected") {
        setError("No se pudo cargar la información de presupuestos.");
      }
    }).finally(() => setLoading(false));
  }, [accessToken, companyId, month]);

  if (!session) return null;

  // ── Combinamos límites + gastos reales ────────────────────────────────────
  const departments: DepartmentSpending[] = (() => {
    const map = new Map<string, DepartmentSpending>();

    // Insertar todos con gasto conocido
    for (const [dept, money] of Object.entries(spending)) {
      map.set(dept, { department: dept, spent: money.amount, currency: money.currency });
    }

    // Overlay con límites
    for (const lim of limits.filter((l) => l.status === "active")) {
      const existing = map.get(lim.department);
      if (existing) {
        existing.limit = lim.monthlyLimit?.amount;
      } else {
        map.set(lim.department, {
          department: lim.department,
          spent: 0,
          limit: lim.monthlyLimit?.amount,
          currency: lim.monthlyLimit?.currency ?? "USD",
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => (b.spent ?? 0) - (a.spent ?? 0));
  })();

  // ── Guardar límite ───────────────────────────────────────────────────────────
  async function handleSave(dept: string, monthly: number, daily?: number) {
    if (!companyId) {
      setSaveError("Falta companyId en la sesión.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const saved = await setDepartmentLimit(session!.accessToken, companyId, {
        department: dept, monthlyLimit: monthly, dailyLimit: daily,
      });
      setLimits((prev) => {
        const exists = prev.findIndex((l) => l.department === dept);
        if (exists >= 0) { const next = [...prev]; next[exists] = saved; return next; }
        return [...prev, saved];
      });
      setShowModal(false);
      setEditTarget(null);
    } catch (err: any) {
      setSaveError(err.message ?? "No se pudo guardar el límite.");
    } finally {
      setSaving(false);
    }
  }

  // ── Meses disponibles para selector ──────────────────────────────────────────
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return d.toISOString().slice(0, 7);
  });

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Presupuesto por Departamento</h1>
          <p className="text-slate-600 mt-1">Control de gasto mensual por área · alertas al 80% del límite</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Selector de mes */}
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {months.map((m) => (
              <option key={m} value={m}>{monthLabel(m)}</option>
            ))}
          </select>
          {canEdit && (
            <button
              onClick={() => { setEditTarget(null); setShowModal(true); }}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Nuevo límite
            </button>
          )}
        </div>
      </div>

      {/* Resumen total */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Gasto total del mes</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{fmtMoney(totalSpent)}</p>
          <p className="text-xs text-slate-400 mt-1">{monthLabel(month)}</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Departamentos</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{departments.length}</p>
          <p className="text-xs text-slate-400 mt-1">{limits.length} con límite configurado</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Alertas activas</p>
          <p className={`text-2xl font-bold mt-1 ${
            departments.filter((d) => d.limit && d.spent / d.limit >= 0.8).length > 0
              ? "text-amber-600" : "text-slate-900"
          }`}>
            {departments.filter((d) => d.limit && d.spent / d.limit >= 0.8).length}
          </p>
          <p className="text-xs text-slate-400 mt-1">≥ 80% del límite</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          {error} — mostrando datos disponibles.
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-white rounded-lg border border-slate-200 animate-pulse" />
          ))}
        </div>
      )}

      {/* Lista de departamentos */}
      {!loading && departments.length === 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
          <p className="text-slate-500 text-sm mb-2">No hay datos de gasto para {monthLabel(month)}.</p>
          {canEdit && (
            <button
              onClick={() => { setEditTarget(null); setShowModal(true); }}
              className="text-blue-600 text-sm font-medium hover:underline"
            >
              Configurar límites de departamento
            </button>
          )}
        </div>
      )}

      {!loading && departments.length > 0 && (
        <div className="space-y-3">
          {departments.map((d) => {
            const pct     = d.limit ? (d.spent / d.limit) * 100 : 0;
            const hasLimit = !!d.limit;
            const isAlert  = hasLimit && pct >= 80 && pct < 100;
            const isOver   = hasLimit && pct >= 100;
            const limitObj = limits.find((l) => l.department === d.department);

            return (
              <div
                key={d.department}
                className={`bg-white rounded-lg border p-5 shadow-sm transition-colors ${
                  isOver  ? "border-red-300 bg-red-50" :
                  isAlert ? "border-amber-300 bg-amber-50" :
                  "border-slate-200"
                }`}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900">{d.department}</p>
                      {isOver && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">Límite superado</span>
                      )}
                      {isAlert && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">⚠ Cerca del límite</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">
                      <span className="font-semibold text-slate-800">{fmtMoney(d.spent)}</span>
                      {hasLimit && (
                        <span className="text-slate-400"> de {fmtMoney(d.limit!)} mensual</span>
                      )}
                      {!hasLimit && <span className="text-slate-400"> · sin límite configurado</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {hasLimit && (
                      <span className={`text-sm font-bold ${
                        isOver ? "text-red-600" : isAlert ? "text-amber-600" : "text-slate-600"
                      }`}>
                        {pct.toFixed(0)}%
                      </span>
                    )}
                    {canEdit && (
                      <button
                        onClick={() => {
                          setEditTarget(limitObj ?? null);
                          setShowModal(true);
                        }}
                        className="px-2.5 py-1 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        {hasLimit ? "Editar" : "Fijar límite"}
                      </button>
                    )}
                  </div>
                </div>

                {hasLimit && <SpendBar pct={pct} />}

                {/* Desglose diario si existe límite diario */}
                {limitObj?.dailyLimit && (
                  <p className="text-xs text-slate-400 mt-2">
                    Límite diario: {fmtMoney(limitObj.dailyLimit.amount)}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal edición */}
      {showModal && (
        <EditModal
          initial={editTarget ? {
            department:   editTarget.department,
            monthlyLimit: editTarget.monthlyLimit?.amount ?? 0,
            dailyLimit:   editTarget.dailyLimit?.amount,
          } : undefined}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditTarget(null); setSaveError(null); }}
          saving={saving}
        />
      )}

      {saveError && (
        <div className="fixed bottom-6 right-6 px-4 py-3 bg-red-600 text-white text-sm rounded-lg shadow-lg z-50">
          {saveError}
        </div>
      )}
    </div>
  );
}
