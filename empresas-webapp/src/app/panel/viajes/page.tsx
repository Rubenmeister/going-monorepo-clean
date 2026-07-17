/**
 * Página de Viajes - Gestión de bookings
 * Ruta: /viajes
 */

"use client";

import { useEffect, useState } from "react";
import { useAuthRedirect } from "@/lib/auth";
import { fetchBookings, rejectBooking } from "@/lib/api";
import { ESTADOS_BOOKING } from "@/lib/constants";

// ─── Tipos ──────────────────────────────────────────────────────────────────

interface Booking {
  id: string;
  serviceId: string;
  serviceType: "transport" | "accommodation" | "tour" | "experience";
  status: "pending" | "confirmed" | "cancelled" | "completed";
  totalPrice: { amount: number; currency: string };
  startDate: string;
  endDate?: string;
  createdAt: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SERVICE_LABELS: Record<string, string> = {
  transport: "Transporte",
  accommodation: "Alojamiento",
  tour: "Tour",
  experience: "Experiencia",
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  completed: "bg-slate-100 text-slate-700",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  cancelled: "Cancelado",
  completed: "Completado",
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

// ─── Componente ──────────────────────────────────────────────────────────────

type StatusFilter = "all" | "pending" | "confirmed" | "cancelled" | "completed";

const FILTERS: { label: string; value: StatusFilter }[] = [
  { label: "Todos", value: "all" },
  { label: "Pendientes", value: "pending" },
  { label: "Confirmados", value: "confirmed" },
  { label: "Completados", value: "completed" },
  { label: "Cancelados", value: "cancelled" },
];

export default function ViajesPage() {
  const { session } = useAuthRedirect();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.accessToken || !session?.user?.companyId) return;
    fetchBookings(session!.accessToken, session!.user.companyId)
      .then((data) => setBookings(data as Booking[]))
      .catch(() => setError("No se pudieron cargar los viajes."))
      .finally(() => setLoading(false));
  }, [session?.accessToken, session?.user?.companyId]);

  const handleCancel = async (bookingId: string) => {
    if (!confirm("¿Seguro que deseas cancelar este viaje?")) return;
    if (!session?.accessToken) return;
    setCancelling(bookingId);
    try {
      // rejectBooking usa corpFetch que maneja 401 + refresh automáticamente
      await rejectBooking(session.accessToken, bookingId);
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, status: "cancelled" } : b
        )
      );
    } catch {
      alert("No se pudo cancelar el viaje. Inténtalo de nuevo.");
    } finally {
      setCancelling(null);
    }
  };

  if (!session) return null;

  const filtered =
    filter === "all" ? bookings : bookings.filter((b) => b.status === filter);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Viajes</h1>
          <p className="text-slate-600 mt-1">Gestión de tus viajes corporativos</p>
        </div>
        <a
          href="/panel/solicitar"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          + Solicitar Viaje
        </a>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f.value
                ? "bg-blue-600 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {f.label}
            {f.value !== "all" && !loading && (
              <span className="ml-1 opacity-70">
                ({bookings.filter((b) => b.status === f.value).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Contenido */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-20 bg-white rounded-lg border border-slate-200 animate-pulse"
            />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-800 text-sm">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
          <p className="text-slate-500">No hay viajes {filter !== "all" ? `con estado "${STATUS_LABELS[filter]}"` : "registrados"}.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm flex items-center justify-between gap-4"
            >
              {/* Info principal */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-900">
                    {SERVICE_LABELS[b.serviceType] ?? b.serviceType}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[b.status] ?? "bg-slate-100 text-slate-700"}`}
                  >
                    {STATUS_LABELS[b.status] ?? b.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  ID: {b.id.slice(0, 8)}… · Creado: {fmtDate(b.createdAt)}
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Inicio: {fmtDate(b.startDate)}
                  {b.endDate ? ` → ${fmtDate(b.endDate)}` : ""}
                </p>
              </div>

              {/* Precio */}
              <div className="text-right shrink-0">
                <p className="text-base font-bold text-slate-900">
                  {fmtMoney(b.totalPrice.amount, b.totalPrice.currency)}
                </p>
              </div>

              {/* Acción cancelar */}
              {b.status === "pending" && (
                <button
                  onClick={() => handleCancel(b.id)}
                  disabled={cancelling === b.id}
                  className="shrink-0 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
                >
                  {cancelling === b.id ? "Cancelando..." : "Cancelar"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Totalizador */}
      {!loading && !error && filtered.length > 0 && (
        <div className="mt-4 flex justify-end">
          <p className="text-sm text-slate-500">
            {filtered.length} viaje{filtered.length !== 1 ? "s" : ""} ·{" "}
            Total:{" "}
            <span className="font-semibold text-slate-900">
              {fmtMoney(
                filtered.reduce((sum, b) => sum + b.totalPrice.amount, 0)
              )}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
