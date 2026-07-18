/**
 * Página de Tracking en Vivo
 * Ruta: /tracking
 *
 * Muestra los viajes activos (status: in_progress) del día.
 * Para cada uno, obtiene la ubicación del conductor vía polling
 * a GET /tracking/booking/:bookingId cada 8 segundos.
 *
 * Al seleccionar un viaje, se muestra el mapa embebido de OpenStreetMap
 * centrado en la posición actual del conductor.
 */

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useAuthRedirect } from "@/lib/auth";
import { fetchBookings, corpFetch } from "@/lib/api";
import { API_BASE_URL } from "@/lib/constants";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface ActiveBooking {
  id:          string;
  serviceType: string;
  status:      string;
  startDate:   string;
  driverId?:   string;
  metadata?:   { origin?: string; destination?: string; requesterName?: string };
  totalPrice?: { amount: number; currency: string };
}

interface DriverLocation {
  driverId:  string;
  latitude:  number;
  longitude: number;
  updatedAt: string;
  speed?:    number;      // km/h
  heading?:  number;      // grados
  address?:  string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 5)  return "ahora mismo";
  if (secs < 60) return `hace ${secs}s`;
  return `hace ${Math.floor(secs / 60)}m`;
}

function osmEmbedUrl(lat: number, lng: number): string {
  const zoom = 16;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01},${lat - 0.01},${lng + 0.01},${lat + 0.01}&layer=mapnik&marker=${lat},${lng}`;
}

function osmLinkUrl(lat: number, lng: number): string {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;
}

const SERVICE_LABELS: Record<string, string> = {
  transport: "Transporte", accommodation: "Alojamiento",
  tour: "Tour", experience: "Experiencia", parcel: "Encomienda",
};

// ─── Página ───────────────────────────────────────────────────────────────────

export default function TrackingPage() {
  const { session } = useAuthRedirect();

  const [bookings,  setBookings]  = useState<ActiveBooking[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [selected,  setSelected]  = useState<string | null>(null);

  // Ubicaciones por bookingId
  const [locations,  setLocations]  = useState<Record<string, DriverLocation>>({});
  const [locError,   setLocError]   = useState<Record<string, string>>({});
  const [lastUpdate, setLastUpdate] = useState<Record<string, string>>({});

  const pollingRef = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  const accessToken = session?.accessToken ?? "";

  // ── Cargar viajes activos del día ──────────────────────────────────────────
  useEffect(() => {
    if (!accessToken) return;
    fetchBookings(accessToken)
      .then((all) => {
        const active = (all as ActiveBooking[]).filter((b) => b.status === "in_progress");
        setBookings(active);
        if (active.length > 0) setSelected(active[0].id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [accessToken]);

  // ── Polling de ubicación por viaje seleccionado ────────────────────────────
  const fetchLocation = useCallback(async (bookingId: string) => {
    if (!accessToken) return;
    try {
      const loc = await corpFetch<DriverLocation>(
        `/tracking/booking/${bookingId}`, accessToken, { silent401: true }
      );
      setLocations((prev) => ({ ...prev, [bookingId]: loc }));
      setLastUpdate((prev) => ({ ...prev, [bookingId]: new Date().toISOString() }));
      setLocError((prev) => { const n = { ...prev }; delete n[bookingId]; return n; });
    } catch {
      setLocError((prev) => ({ ...prev, [bookingId]: "Sin datos de ubicación" }));
    }
  }, [accessToken]);

  useEffect(() => {
    if (!selected) return;

    // Fetch inmediato + polling cada 8 s
    fetchLocation(selected);
    const interval = setInterval(() => fetchLocation(selected), 8_000);
    pollingRef.current[selected] = interval;

    return () => {
      clearInterval(pollingRef.current[selected]);
      delete pollingRef.current[selected];
    };
  }, [selected, fetchLocation]);

  if (!session) return null;

  const selectedBooking  = bookings.find((b) => b.id === selected);
  const selectedLocation = selected ? locations[selected] : null;
  const selectedError    = selected ? locError[selected] : null;

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-slate-900">Tracking en Vivo</h1>
          {bookings.length > 0 && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              {bookings.length} activo{bookings.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <p className="text-slate-600 mt-1">Posición en tiempo real de tus viajes en curso · actualiza cada 8s</p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1,2].map((i) => <div key={i} className="h-20 bg-white rounded-lg border border-slate-200 animate-pulse" />)}
        </div>
      )}

      {/* Sin viajes activos */}
      {!loading && bookings.length === 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center shadow-sm">
          <p className="text-3xl mb-3">🗺️</p>
          <p className="text-slate-700 font-medium mb-1">No hay viajes en curso ahora mismo</p>
          <p className="text-slate-500 text-sm">
            El tracking estará disponible cuando haya viajes con estado <strong>En Progreso</strong>.
          </p>
        </div>
      )}

      {!loading && bookings.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Lista de viajes activos */}
          <div className="lg:col-span-1 space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Viajes activos</p>
            {bookings.map((b) => {
              const isSelected = selected === b.id;
              const loc        = locations[b.id];
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setSelected(b.id)}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    isSelected
                      ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold truncate ${isSelected ? "text-blue-700" : "text-slate-900"}`}>
                        {b.metadata?.requesterName ?? "Viaje corporativo"}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {SERVICE_LABELS[b.serviceType] ?? b.serviceType}
                      </p>
                      {b.metadata?.origin && (
                        <p className="text-xs text-slate-400 truncate mt-0.5">
                          {b.metadata.origin}
                          {b.metadata.destination ? ` → ${b.metadata.destination}` : ""}
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0 flex flex-col items-end gap-1">
                      <span className="flex items-center gap-1 text-green-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs font-medium">En curso</span>
                      </span>
                      {loc && (
                        <span className="text-xs text-slate-400">{timeAgo(loc.updatedAt)}</span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Panel de mapa y detalle */}
          <div className="lg:col-span-2 space-y-4">

            {/* Info del viaje */}
            {selectedBooking && (
              <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {selectedBooking.metadata?.requesterName ?? `Viaje ${selectedBooking.id.slice(0,8)}`}
                    </p>
                    <p className="text-sm text-slate-500">
                      {selectedBooking.metadata?.origin ?? "—"}
                      {selectedBooking.metadata?.destination ? ` → ${selectedBooking.metadata.destination}` : ""}
                    </p>
                  </div>
                  {selectedLocation && (
                    <div className="text-right">
                      <p className="text-xs text-slate-500">
                        {selectedLocation.latitude.toFixed(5)}, {selectedLocation.longitude.toFixed(5)}
                      </p>
                      {selectedLocation.speed != null && (
                        <p className="text-xs text-slate-400">{selectedLocation.speed} km/h</p>
                      )}
                      <p className="text-xs text-slate-400 mt-0.5">
                        Actualizado: {timeAgo(selectedLocation.updatedAt)}
                      </p>
                    </div>
                  )}
                </div>
                {selectedLocation?.address && (
                  <p className="text-xs text-slate-500 mt-2 border-t border-slate-100 pt-2">
                    📍 {selectedLocation.address}
                  </p>
                )}
              </div>
            )}

            {/* Mapa */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              {selectedError && !selectedLocation && (
                <div className="h-72 flex flex-col items-center justify-center gap-3 text-center p-8">
                  <p className="text-2xl">📡</p>
                  <p className="text-slate-600 font-medium text-sm">Esperando señal GPS del conductor…</p>
                  <p className="text-slate-400 text-xs">{selectedError}</p>
                  <p className="text-slate-400 text-xs">Actualizando automáticamente cada 8 segundos</p>
                </div>
              )}

              {selectedLocation && (
                <>
                  <iframe
                    key={`${selectedLocation.latitude}-${selectedLocation.longitude}`}
                    src={osmEmbedUrl(selectedLocation.latitude, selectedLocation.longitude)}
                    className="w-full h-72 border-0"
                    title="Ubicación del conductor"
                    loading="lazy"
                  />
                  <div className="px-4 py-2.5 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-xs text-slate-600 font-medium">Posición en vivo</span>
                    </div>
                    <a
                      href={osmLinkUrl(selectedLocation.latitude, selectedLocation.longitude)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-600 hover:underline font-medium"
                    >
                      Abrir en mapa →
                    </a>
                  </div>
                </>
              )}

              {!selectedLocation && !selectedError && (
                <div className="h-72 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">Obteniendo ubicación…</p>
                  </div>
                </div>
              )}
            </div>

            {/* Nota de actualización */}
            <p className="text-xs text-slate-400 text-center">
              La posición se actualiza automáticamente cada 8 segundos.
              El conductor debe tener la app Going App activa para compartir su ubicación.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
