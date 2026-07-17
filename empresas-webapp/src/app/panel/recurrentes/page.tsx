/**
 * Página de Solicitudes Recurrentes
 * Ruta: /panel/recurrentes
 *
 * Programa viajes que se repiten automáticamente.
 * Persistencia en backend: /recurring-trips (booking-service via api-gateway).
 * Un cron diario @02:00 ECT genera bookings concretos para los próximos
 * 30 días según frequency/weekDays/dayOfMonth.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthRedirect } from "@/lib/auth";
import { AUTH_TOKEN_KEY } from "@/lib/constants";
import {
  fetchRecurringTrips,
  createRecurringTrip,
  updateRecurringTrip,
  deleteRecurringTrip,
  pauseRecurringTrip,
  resumeRecurringTrip,
  type RecurringTrip,
  type RecurringTripInput,
} from "@/lib/api";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Frequency  = "daily" | "weekly" | "monthly";
type ServiceType = "transport" | "parcel";
type WeekDay    = 0 | 1 | 2 | 3 | 4 | 5 | 6;

// ─── Constantes ───────────────────────────────────────────────────────────────

const FREQ_LABELS: Record<Frequency, string> = {
  daily:   "Todos los días",
  weekly:  "Semanal",
  monthly: "Mensual",
};

const WEEKDAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const INPUT  = "w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white placeholder:text-slate-400";
const SELECT = INPUT + " cursor-pointer";

// ─── Helpers UI ───────────────────────────────────────────────────────────────

function nextRunLabel(trip: RecurringTrip): string {
  const now = new Date();
  if (trip.frequency === "daily") {
    const [h, m] = trip.time.split(":").map(Number);
    const next = new Date(now);
    next.setHours(h, m, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    return next.toLocaleDateString("es-EC", { weekday: "short", day: "numeric", month: "short" }) + ` · ${trip.time}`;
  }
  if (trip.frequency === "weekly" && trip.weekDays?.length) {
    const todayDay = now.getDay() as WeekDay;
    const sorted = [...trip.weekDays].sort((a, b) => a - b);
    const next = (sorted.find((d) => d > todayDay) ?? sorted[0]) as WeekDay;
    const diff = next > todayDay ? next - todayDay : 7 - todayDay + next;
    const nextDate = new Date(now);
    nextDate.setDate(nextDate.getDate() + diff);
    return nextDate.toLocaleDateString("es-EC", { weekday: "short", day: "numeric", month: "short" }) + ` · ${trip.time}`;
  }
  if (trip.frequency === "monthly" && trip.dayOfMonth) {
    const next = new Date(now.getFullYear(), now.getMonth(), trip.dayOfMonth);
    if (next <= now) next.setMonth(next.getMonth() + 1);
    return next.toLocaleDateString("es-EC", { day: "numeric", month: "long" }) + ` · ${trip.time}`;
  }
  return "—";
}

// ─── Modal de edición ─────────────────────────────────────────────────────────

interface ModalProps {
  initial?: RecurringTrip;
  onSave:  (data: RecurringTripInput) => Promise<void>;
  onClose: () => void;
}

function RecurringModal({ initial, onSave, onClose }: ModalProps) {
  const [name,        setName]        = useState(initial?.name        ?? "");
  const [serviceType, setServiceType] = useState<ServiceType>(initial?.serviceType ?? "transport");
  const [frequency,   setFrequency]   = useState<Frequency>(initial?.frequency ?? "daily");
  const [weekDays,    setWeekDays]    = useState<WeekDay[]>((initial?.weekDays ?? [1]) as WeekDay[]);
  const [dayOfMonth,  setDayOfMonth]  = useState(String(initial?.dayOfMonth ?? 1));
  const [time,        setTime]        = useState(initial?.time        ?? "08:00");
  const [origin,      setOrigin]      = useState(initial?.origin.address ?? "");
  const [destination, setDestination] = useState(initial?.destination.address ?? "");
  const [vehicleType, setVehicleType] = useState(initial?.vehicleType ?? "sedan");
  const [notes,       setNotes]       = useState(initial?.notes       ?? "");
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  function toggleDay(d: WeekDay) {
    setWeekDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort((a,b) => a-b)
    );
  }

  async function handleSubmit() {
    setSaving(true);
    setError(null);
    try {
      await onSave({
        name, serviceType, frequency,
        weekDays:   frequency === "weekly"  ? weekDays : undefined,
        dayOfMonth: frequency === "monthly" ? parseInt(dayOfMonth) : undefined,
        time,
        origin:      { address: origin },
        destination: { address: destination },
        vehicleType: serviceType === "transport" ? vehicleType : undefined,
        notes: notes || undefined,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && !saving && onClose()}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 my-4 space-y-4">
        <h3 className="text-base font-bold text-slate-900">
          {initial?.id ? "Editar recurrente" : "Nueva solicitud recurrente"}
        </h3>

        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Nombre *</label>
          <input className={INPUT} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Traslado diario aeropuerto" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Tipo</label>
            <select className={SELECT} value={serviceType} onChange={(e) => setServiceType(e.target.value as ServiceType)}>
              <option value="transport">Transporte</option>
              <option value="parcel">Encomienda</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Frecuencia</label>
            <select className={SELECT} value={frequency} onChange={(e) => setFrequency(e.target.value as Frequency)}>
              <option value="daily">Diaria</option>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensual</option>
            </select>
          </div>
        </div>

        {/* Días de la semana */}
        {frequency === "weekly" && (
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Días *</label>
            <div className="flex gap-1.5 flex-wrap">
              {WEEKDAY_LABELS.map((label, i) => (
                <button key={i} type="button" onClick={() => toggleDay(i as WeekDay)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                    weekDays.includes(i as WeekDay)
                      ? "bg-blue-600 text-white border-blue-600"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Día del mes */}
        {frequency === "monthly" && (
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Día del mes *</label>
            <input type="number" min="1" max="28" className={INPUT} value={dayOfMonth}
              onChange={(e) => setDayOfMonth(e.target.value)} placeholder="1–28" />
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Hora *</label>
          <input type="time" className={INPUT} value={time} onChange={(e) => setTime(e.target.value)} />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Origen *</label>
          <input className={INPUT} value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="Dirección de recogida" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Destino *</label>
          <input className={INPUT} value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Dirección de llegada" />
        </div>

        {serviceType === "transport" && (
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Vehículo</label>
            <select className={SELECT} value={vehicleType} onChange={(e) => setVehicleType(e.target.value)}>
              <option value="sedan">Sedán (1–4 pax)</option>
              <option value="suv">SUV (1–6 pax)</option>
              <option value="van">Van (7–12 pax)</option>
              <option value="minibus">Minibús (13–20 pax)</option>
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Notas</label>
          <input className={INPUT} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Requerimientos especiales…" />
        </div>

        {error && (
          <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} disabled={saving} className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || !origin.trim() || !destination.trim() || !time || saving}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function RecurrentesPage() {
  const { session } = useAuthRedirect();
  const [trips,       setTrips]       = useState<RecurringTrip[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [showModal,   setShowModal]   = useState(false);
  const [editTarget,  setEditTarget]  = useState<RecurringTrip | null>(null);
  const [confirmDel,  setConfirmDel]  = useState<string | null>(null);

  const reload = useCallback(async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem(AUTH_TOKEN_KEY) ?? "" : "";
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const items = await fetchRecurringTrips(token);
      setTrips(items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error cargando recurrentes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user.id) void reload();
  }, [session?.user.id, reload]);

  if (!session) return null;

  function getToken(): string {
    return typeof window !== "undefined" ? localStorage.getItem(AUTH_TOKEN_KEY) ?? "" : "";
  }

  async function handleSave(data: RecurringTripInput) {
    const token = getToken();
    if (editTarget) {
      const updated = await updateRecurringTrip(token, editTarget.id, data);
      setTrips((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } else {
      const created = await createRecurringTrip(token, data);
      setTrips((prev) => [created, ...prev]);
    }
    setShowModal(false);
    setEditTarget(null);
  }

  async function handleToggleActive(t: RecurringTrip) {
    const token = getToken();
    try {
      const updated = t.active
        ? await pauseRecurringTrip(token, t.id)
        : await resumeRecurringTrip(token, t.id);
      setTrips((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cambiar estado");
    }
  }

  async function handleDelete(id: string) {
    const token = getToken();
    try {
      await deleteRecurringTrip(token, id);
      setTrips((prev) => prev.filter((x) => x.id !== id));
      setConfirmDel(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al eliminar");
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Solicitudes Recurrentes</h1>
          <p className="text-slate-600 mt-1">Programa viajes que se repiten automáticamente</p>
        </div>
        <button onClick={() => { setEditTarget(null); setShowModal(true); }}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700">
          + Nueva recurrencia
        </button>
      </div>

      {/* Banner informativo */}
      <div className="mb-5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
        Going App programa automáticamente cada viaje según la frecuencia definida. Los bookings
        aparecen en <strong>Viajes</strong> con 30 días de anticipación. Puedes pausar
        o eliminar cualquier recurrencia en cualquier momento.
      </div>

      {error && (
        <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center shadow-sm">
          <p className="text-slate-500 text-sm">Cargando recurrentes…</p>
        </div>
      )}

      {/* Vacío */}
      {!loading && trips.length === 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center shadow-sm">
          <p className="text-3xl mb-3">🔄</p>
          <p className="text-slate-700 font-medium mb-1">Sin solicitudes recurrentes</p>
          <p className="text-slate-500 text-sm mb-5">
            Automatiza tus traslados frecuentes para no tener que solicitarlos manualmente cada vez.
          </p>
          <button onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700">
            Crear primera recurrencia
          </button>
        </div>
      )}

      {/* Lista */}
      {!loading && trips.length > 0 && (
        <div className="space-y-3">
          {trips.map((t) => (
            <div key={t.id} className={`bg-white rounded-lg border p-5 shadow-sm transition-opacity ${t.active ? "" : "opacity-60"}`}
              style={{ borderColor: t.active ? undefined : "#e2e8f0" }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-slate-900">{t.name}</p>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">
                      {FREQ_LABELS[t.frequency]}
                    </span>
                    {!t.active && (
                      <span className="px-2 py-0.5 bg-slate-200 text-slate-500 text-xs rounded-full">Pausada</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mt-1">{t.origin.address} → {t.destination.address}</p>
                  <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-slate-400">
                    <span>🕐 {t.time}</span>
                    {t.frequency === "weekly" && t.weekDays && (
                      <span>{t.weekDays.map((d) => WEEKDAY_LABELS[d]).join(", ")}</span>
                    )}
                    {t.frequency === "monthly" && t.dayOfMonth && (
                      <span>Día {t.dayOfMonth} de cada mes</span>
                    )}
                    {t.active && (
                      <span className="text-blue-500 font-medium">
                        Próxima: {nextRunLabel(t)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Toggle activo */}
                  <button onClick={() => handleToggleActive(t)}
                    className={`w-10 h-6 rounded-full transition-colors relative flex-shrink-0 ${t.active ? "bg-blue-600" : "bg-slate-300"}`}>
                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${t.active ? "translate-x-5" : "translate-x-1"}`} />
                  </button>
                  <button onClick={() => { setEditTarget(t); setShowModal(true); }}
                    className="px-2.5 py-1 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-50">
                    Editar
                  </button>
                  {confirmDel === t.id ? (
                    <div className="flex gap-1">
                      <button onClick={() => handleDelete(t.id)}
                        className="px-2.5 py-1 bg-red-600 text-white text-xs font-semibold rounded-lg">Eliminar</button>
                      <button onClick={() => setConfirmDel(null)}
                        className="px-2.5 py-1 border border-slate-200 text-xs text-slate-500 rounded-lg">No</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDel(t.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-50 transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <RecurringModal
          initial={editTarget ?? undefined}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditTarget(null); }}
        />
      )}
    </div>
  );
}
