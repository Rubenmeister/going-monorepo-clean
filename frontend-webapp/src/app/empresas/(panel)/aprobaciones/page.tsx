/**
 * Página de Aprobaciones
 * Ruta: /empresas/aprobaciones
 *
 * Solo visible para usuarios con rol "aprobador" o "admin".
 * Las aprobaciones son bookings con status "pending".
 */

"use client";

import { useEffect, useState } from "react";
import { useAuthRedirect } from "@/lib/empresas/auth";
import { fetchApprovals, approveBooking, rejectBooking } from "@/lib/empresas/api";

interface Booking {
  id: string;
  serviceType: "transport" | "accommodation" | "tour" | "experience";
  totalPrice: { amount: number; currency: string };
  startDate: string;
  endDate?: string;
  createdAt: string;
}

const SERVICE_LABELS: Record<string, string> = {
  transport: "Transporte",
  accommodation: "Alojamiento",
  tour: "Tour",
  experience: "Experiencia",
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("es-EC", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function fmtMoney(amount: number, currency = "USD") {
  return `${currency} ${amount.toLocaleString("es-EC", { minimumFractionDigits: 2 })}`;
}

type ActionState = { id: string; type: "approve" | "reject" } | null;

export default function AprobacionesPage() {
  const { session } = useAuthRedirect();
  const [pendientes, setPendientes] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<ActionState>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => {
    if (!session?.accessToken) return;
    fetchApprovals(session.accessToken)
      .then(setPendientes)
      .catch(() => setError("No se pudieron cargar las aprobaciones."))
      .finally(() => setLoading(false));
  }, [session?.accessToken]);

  if (!session) return null;

  const puedeAprobar =
    session.user.roles.includes("aprobador") ||
    session.user.roles.includes("admin");

  if (!puedeAprobar) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Acceso Denegado</h1>
        <p className="text-slate-600 mt-2">
          Solo aprobadores y administradores pueden acceder a esta sección.
        </p>
      </div>
    );
  }

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const handleApprove = async (b: Booking) => {
    setActing({ id: b.id, type: "approve" });
    try {
      await approveBooking(session.accessToken!, b.id);
      setPendientes((prev) => prev.filter((x) => x.id !== b.id));
      showToast("Viaje aprobado correctamente.", true);
    } catch {
      showToast("No se pudo aprobar. Intenta de nuevo.", false);
    } finally {
      setActing(null);
    }
  };

  const handleReject = async (b: Booking) => {
    if (!confirm("¿Seguro que deseas rechazar este viaje?")) return;
    setActing({ id: b.id, type: "reject" });
    try {
      await rejectBooking(session.accessToken!, b.id);
      setPendientes((prev) => prev.filter((x) => x.id !== b.id));
      showToast("Viaje rechazado.", true);
    } catch {
      showToast("No se pudo rechazar. Intenta de nuevo.", false);
    } finally {
      setActing(null);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Aprobaciones Pendientes</h1>
        <p className="text-slate-600 mt-1">
          Revisa y aprueba o rechaza los viajes solicitados
        </p>
      </div>

      {toast && (
        <div
          className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${
            toast.ok
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          {toast.msg}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-800 text-sm">
          {error}
        </div>
      )}

      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-white rounded-lg border border-slate-200 animate-pulse" />
          ))}
        </div>
      )}

      {!loading && !error && pendientes.length === 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
          <p className="text-2xl mb-2">✅</p>
          <p className="text-slate-600 font-medium">No hay aprobaciones pendientes.</p>
          <p className="text-sm text-slate-500 mt-1">Todo está al día.</p>
        </div>
      )}

      {!loading && !error && pendientes.length > 0 && (
        <>
          <div className="space-y-4">
            {pendientes.map((b) => {
              const isActing = acting?.id === b.id;
              return (
                <div key={b.id} className="bg-white rounded-lg border border-amber-200 p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                          Pendiente de aprobación
                        </span>
                        <span className="text-sm font-semibold text-slate-800">
                          {SERVICE_LABELS[b.serviceType] ?? b.serviceType}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        ID: {b.id.slice(0, 8)}… · Solicitado: {fmtDate(b.createdAt)}
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Inicio: {fmtDate(b.startDate)}
                        {b.endDate ? ` → ${fmtDate(b.endDate)}` : ""}
                      </p>
                      <p className="text-base font-bold text-slate-900 mt-2">
                        {fmtMoney(b.totalPrice.amount, b.totalPrice.currency)}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 shrink-0">
                      <button
                        onClick={() => handleApprove(b)}
                        disabled={!!acting}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
                      >
                        {isActing && acting?.type === "approve" ? "Aprobando..." : "✓ Aprobar"}
                      </button>
                      <button
                        onClick={() => handleReject(b)}
                        disabled={!!acting}
                        className="px-4 py-2 bg-white hover:bg-red-50 disabled:opacity-50 text-red-600 border border-red-200 text-sm font-semibold rounded-lg transition-colors"
                      >
                        {isActing && acting?.type === "reject" ? "Rechazando..." : "✗ Rechazar"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-4 text-sm text-slate-500 text-right">
            {pendientes.length} viaje{pendientes.length !== 1 ? "s" : ""} pendiente{pendientes.length !== 1 ? "s" : ""}
          </p>
        </>
      )}
    </div>
  );
}
