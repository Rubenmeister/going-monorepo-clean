/**
 * Página de Solicitar Viaje — Wizard 2 pasos
 * Ruta: /solicitar
 *
 * Paso 1: Tipo de servicio + criterios de búsqueda / detalles
 * Paso 2: Resultados del catálogo para seleccionar (tour / alojamiento / experiencia)
 *         Transport y Parcel van directo a confirmación.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthRedirect } from "@/lib/auth";
import AddressAutocomplete, { rememberAddress } from "@/components/AddressAutocomplete";
import {
  crearBooking,
  searchTours,
  searchAccommodations,
  searchExperiences,
  TourItem,
  AccommodationItem,
  ExperienceItem,
} from "@/lib/api";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type ServiceType = "transport" | "accommodation" | "tour" | "experience" | "parcel";
type VehicleType  = "sedan" | "suv" | "van" | "minibus";
type CatalogType  = "tour" | "accommodation" | "experience";
type CatalogItem  = TourItem | AccommodationItem | ExperienceItem;

const CATALOG_TYPES: ServiceType[] = ["tour", "accommodation", "experience"];
const isCatalog = (t: ServiceType): t is CatalogType => CATALOG_TYPES.includes(t);

// ─── Constantes UI ───────────────────────────────────────────────────────────

const SERVICES: { key: ServiceType; label: string; desc: string }[] = [
  { key: "transport",     label: "Transporte",   desc: "Traslados, aeropuerto, ejecutivo" },
  { key: "tour",          label: "Tours",         desc: "Tours y excursiones grupales" },
  { key: "experience",    label: "Experiencias",  desc: "Team building y eventos corporativos" },
  { key: "accommodation", label: "Alojamiento",   desc: "Hospedaje para viajeros corporativos" },
  { key: "parcel",        label: "Encomienda",    desc: "Envío de documentos y paquetes" },
];

const TOUR_CATEGORIES = [
  { key: "ADVENTURE",   label: "Aventura" },
  { key: "CULTURAL",    label: "Cultural" },
  { key: "GASTRONOMY",  label: "Gastronomía" },
  { key: "NATURE",      label: "Naturaleza" },
];

const VEHICLES: { key: VehicleType; label: string; cap: string }[] = [
  { key: "sedan",   label: "Sedán",   cap: "1–4 pax" },
  { key: "suv",     label: "SUV",     cap: "1–6 pax" },
  { key: "van",     label: "Van",     cap: "7–12 pax" },
  { key: "minibus", label: "Minibús", cap: "13–20 pax" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const INPUT =
  "w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 " +
  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white " +
  "placeholder:text-slate-400 disabled:bg-slate-50";

const SELECT = INPUT + " cursor-pointer";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

function fmtMoney(amount: number, currency = "USD") {
  return `${currency} ${amount.toLocaleString("es-EC", { minimumFractionDigits: 2 })}`;
}

function getItemPrice(item: CatalogItem): number {
  if ("pricePerNight" in item) return item.pricePerNight.amount;
  return (item as TourItem | ExperienceItem).price.amount;
}

function getItemPriceLabel(serviceType: CatalogType): string {
  if (serviceType === "accommodation") return "/ noche";
  return "/ persona";
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function SolicitarViajePage() {
  const { session } = useAuthRedirect();
  const router = useRouter();

  const tipoCuenta = session?.user.tipoCuenta as string | undefined;
  const isAgencia  = tipoCuenta === "agencia";
  const isGrande   = tipoCuenta === "grande";

  // ── Paso actual ───────────────────────────────────────────────────────────
  const [step, setStep] = useState<1 | 2>(1);

  // ── Campos comunes paso 1 ─────────────────────────────────────────────────
  const [serviceType, setServiceType]       = useState<ServiceType>("transport");
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [requesterName, setRequesterName]   = useState("");
  const [passengerName, setPassengerName]   = useState("");
  const [department, setDepartment]         = useState("");
  const [notes, setNotes]                   = useState("");

  // ── Filtros de catálogo (paso 1 para tipos catalogo) ─────────────────────
  const [searchCity, setSearchCity]         = useState("");
  const [searchCategory, setSearchCategory] = useState("");
  const [searchMaxPrice, setSearchMaxPrice] = useState("");
  const [searchCapacity, setSearchCapacity] = useState("");

  // ── Fechas ────────────────────────────────────────────────────────────────
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate]     = useState("");

  // ── Transporte ────────────────────────────────────────────────────────────
  const [origin, setOrigin]           = useState("");
  const [destination, setDestination] = useState("");
  const [passengers, setPassengers]   = useState("1");
  const [vehicleType, setVehicleType] = useState<VehicleType>("sedan");
  const [roundTrip, setRoundTrip]     = useState(false);

  // ── Encomienda ────────────────────────────────────────────────────────────
  const [parcelOrigin, setParcelOrigin]       = useState("");
  const [parcelDest, setParcelDest]           = useState("");
  const [parcelDescription, setParcelDescription] = useState("");

  // ── Importe estimado ──────────────────────────────────────────────────────
  const [estimatedAmount, setEstimatedAmount] = useState("");

  // ── Catálogo paso 2 ───────────────────────────────────────────────────────
  const [catalogResults, setCatalogResults] = useState<CatalogItem[]>([]);
  const [selectedItem, setSelectedItem]     = useState<CatalogItem | null>(null);
  const [searching, setSearching]           = useState(false);
  const [searchError, setSearchError]       = useState<string | null>(null);

  // ── Submit final ──────────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess]        = useState(false);

  if (!session) return null;

  const today = new Date().toISOString().split("T")[0];

  // ── Buscar catálogo ────────────────────────────────────────────────────────
  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearching(true);
    setSearchError(null);
    setCatalogResults([]);
    setSelectedItem(null);

    try {
      let results: CatalogItem[] = [];
      if (serviceType === "tour") {
        results = await searchTours(session!.accessToken, {
          locationCity: searchCity || undefined,
          category:     searchCategory || undefined,
          maxPrice:     searchMaxPrice ? parseFloat(searchMaxPrice) : undefined,
        });
      } else if (serviceType === "accommodation") {
        results = await searchAccommodations(session!.accessToken, {
          city:     searchCity || undefined,
          capacity: searchCapacity ? parseInt(searchCapacity) : undefined,
        });
      } else if (serviceType === "experience") {
        results = await searchExperiences(session!.accessToken, {
          locationCity: searchCity || undefined,
          maxPrice:     searchMaxPrice ? parseFloat(searchMaxPrice) : undefined,
        });
      }

      setCatalogResults(results);
      setStep(2);
    } catch {
      setSearchError("No se pudo obtener el catálogo. Verifica tu conexión.");
    } finally {
      setSearching(false);
    }
  }

  // ── Confirmar reserva ──────────────────────────────────────────────────────
  async function handleConfirm() {
    if (!selectedItem) return;
    setSubmitError(null);
    setSubmitting(true);

    const price = getItemPrice(selectedItem);
    const isoStart = startDate
      ? `${startDate}T${startTime || "00:00"}:00`
      : new Date().toISOString();
    const isoEnd = endDate ? `${endDate}T12:00:00` : undefined;

    try {
      await crearBooking(session!.accessToken, {
        userId:      session!.user.id ?? session!.user._id ?? '',
        serviceId:   selectedItem.id,
        serviceType: serviceType as any,
        totalPrice:  { amount: price, currency: "USD" },
        startDate:   isoStart,
        endDate:     isoEnd,
        notes:       notes || undefined,
        metadata: {
          requesterName:    requesterName || session!.user.nombre,
          department,
          requiresApproval,
          ...(isAgencia && { passengerName }),
          itemTitle:        selectedItem.title,
        },
      });
      setSuccess(true);
    } catch (err: any) {
      setSubmitError(err.message ?? "No se pudo confirmar la reserva.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Confirmar transporte / encomienda (sin catálogo) ───────────────────────
  async function handleDirectSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!startDate) {
      setSubmitError("Por favor ingresa la fecha del servicio.");
      return;
    }
    setSubmitting(true);
    const isoStart = `${startDate}T${startTime || "00:00"}:00`;
    const isoEnd   = roundTrip && startDate
      ? (() => { const d = new Date(startDate); d.setDate(d.getDate() + 1); return d.toISOString().split("T")[0] + "T00:00:00"; })()
      : undefined;

    const meta: Record<string, unknown> = {
      requesterName: requesterName || session!.user.nombre,
      department,
      requiresApproval,
      ...(isAgencia && { passengerName }),
    };
    if (serviceType === "transport") {
      Object.assign(meta, { origin, destination, passengers: +passengers, vehicleType, roundTrip });
      rememberAddress(origin); rememberAddress(destination);
    } else {
      Object.assign(meta, { origin: parcelOrigin, destination: parcelDest, description: parcelDescription });
      rememberAddress(parcelOrigin); rememberAddress(parcelDest);
    }

    try {
      await crearBooking(session!.accessToken, {
        userId:      session!.user.id ?? session!.user._id ?? '',
        serviceId:  crypto.randomUUID(), // asignado por Going App al procesar
        serviceType: serviceType as any,
        totalPrice: { amount: parseFloat(estimatedAmount) || 0, currency: "USD" },
        startDate:  isoStart,
        endDate:    isoEnd,
        notes:      notes || undefined,
        metadata:   meta,
      });
      setSuccess(true);
    } catch (err: any) {
      setSubmitError(err.message ?? "No se pudo enviar la solicitud.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Pantalla de éxito ──────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="max-w-2xl">
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            {requiresApproval ? "Solicitud enviada para aprobación" : "Reserva confirmada"}
          </h2>
          <p className="text-slate-500 text-sm mb-6">
            {requiresApproval
              ? "Tu solicitud está pendiente. Recibirás una notificación al ser procesada."
              : "Tu reserva fue registrada. Going App coordinará el servicio y recibirás los detalles por email."}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { setSuccess(false); setStep(1); setSelectedItem(null); setCatalogResults([]); }}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Nueva solicitud
            </button>
            <button
              onClick={() => router.push("/panel/viajes")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Ver mis viajes
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PASO 2 — Resultados del catálogo
  // ─────────────────────────────────────────────────────────────────────────
  if (step === 2 && isCatalog(serviceType)) {
    const serviceLabel = SERVICES.find((s) => s.key === serviceType)?.label ?? serviceType;

    return (
      <div className="max-w-3xl">
        {/* Header + back */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <button
              onClick={() => { setStep(1); setSelectedItem(null); }}
              className="text-sm text-slate-500 hover:text-slate-700 mb-2 flex items-center gap-1"
            >
              ← Volver a búsqueda
            </button>
            <h1 className="text-2xl font-bold text-slate-900">
              {serviceLabel} disponibles
            </h1>
            {searchCity && (
              <p className="text-slate-500 text-sm mt-1">
                {searchCity}{searchCategory ? ` · ${searchCategory}` : ""}
                {searchMaxPrice ? ` · hasta $${searchMaxPrice}` : ""}
              </p>
            )}
          </div>
          {/* Paso indicator */}
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center">1</span>
            <span className="w-8 h-px bg-slate-300" />
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center">2</span>
          </div>
        </div>

        {/* Sin resultados */}
        {catalogResults.length === 0 && (
          <div className="bg-white rounded-lg border border-slate-200 p-10 text-center">
            <p className="text-slate-500 text-sm">
              No se encontraron {serviceLabel.toLowerCase()} con esos criterios.
            </p>
            <button
              onClick={() => setStep(1)}
              className="mt-4 text-blue-600 text-sm font-medium hover:underline"
            >
              Modificar búsqueda
            </button>
          </div>
        )}

        {/* Grid de resultados */}
        {catalogResults.length > 0 && (
          <div className="space-y-3 mb-6">
            {catalogResults.map((item) => {
              const price    = getItemPrice(item);
              const isSelected = selectedItem?.id === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedItem(isSelected ? null : item)}
                  className={`w-full text-left bg-white rounded-lg border p-5 transition-all shadow-sm ${
                    isSelected
                      ? "border-blue-500 ring-1 ring-blue-500"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`font-semibold text-slate-900 ${isSelected ? "text-blue-700" : ""}`}>
                          {item.title}
                        </p>
                        {"category" in item && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-600">
                            {TOUR_CATEGORIES.find((c) => c.key === item.category)?.label ?? item.category}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 mt-1 line-clamp-2">{item.description}</p>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500">
                        {item.location?.city && (
                          <span>{item.location.city}</span>
                        )}
                        {"durationHours" in item && (
                          <span>{(item as TourItem).durationHours}h</span>
                        )}
                        {"maxGuests" in item && (
                          <span>Máx {(item as TourItem).maxGuests} pax</span>
                        )}
                        {"capacity" in item && (
                          <span>Capacidad: {(item as AccommodationItem).capacity}</span>
                        )}
                        {"amenities" in item && (item as AccommodationItem).amenities?.length > 0 && (
                          <span>{(item as AccommodationItem).amenities.slice(0, 3).join(" · ")}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-bold text-slate-900">{fmtMoney(price)}</p>
                      <p className="text-xs text-slate-400">{getItemPriceLabel(serviceType as CatalogType)}</p>
                      {isSelected && (
                        <span className="mt-1 inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                          Seleccionado
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Detalles de fecha + confirmación */}
        {selectedItem && (
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm space-y-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Confirmar fechas y detalles
            </p>

            <div className="grid grid-cols-2 gap-3">
              <Field label={serviceType === "accommodation" ? "Check-in" : "Fecha"} required>
                <input type="date" className={INPUT} value={startDate} min={today}
                  onChange={(e) => setStartDate(e.target.value)} required />
              </Field>
              {serviceType === "accommodation" ? (
                <Field label="Check-out" required>
                  <input type="date" className={INPUT} value={endDate} min={startDate || today}
                    onChange={(e) => setEndDate(e.target.value)} required />
                </Field>
              ) : (
                <Field label="Hora de inicio">
                  <input type="time" className={INPUT} value={startTime}
                    onChange={(e) => setStartTime(e.target.value)} />
                </Field>
              )}
            </div>

            {isAgencia && (
              <Field label="Nombre del pasajero / cliente" required>
                <input className={INPUT} value={passengerName}
                  onChange={(e) => setPassengerName(e.target.value)}
                  placeholder="Nombre completo del pasajero" required />
              </Field>
            )}

            <Field label="Notas adicionales">
              <textarea rows={2} className={INPUT + " resize-none"} value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Requerimientos especiales, preferencias…" />
            </Field>

            {isGrande && (
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div
                  onClick={() => setRequiresApproval((v) => !v)}
                  className={`w-10 h-6 rounded-full transition-colors relative flex-shrink-0 ${
                    requiresApproval ? "bg-amber-500" : "bg-slate-200"
                  }`}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    requiresApproval ? "translate-x-5" : "translate-x-1"
                  }`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">Enviar para aprobación</p>
                  <p className="text-xs text-slate-500">Se confirma solo tras autorización del aprobador</p>
                </div>
              </label>
            )}

            {submitError && (
              <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                {submitError}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cambiar selección
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={submitting || !startDate}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting
                  ? "Confirmando…"
                  : requiresApproval
                  ? "Enviar para aprobación"
                  : isAgencia
                  ? "Reservar para cliente"
                  : "Confirmar reserva"}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PASO 1 — Criterios de búsqueda / detalles directos
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {isAgencia ? "Reservar para Cliente" : "Solicitar Viaje"}
          </h1>
          <p className="text-slate-600 mt-1">
            {isAgencia
              ? "Gestiona una reserva corporativa a nombre de tu cliente"
              : "Crea una solicitud de servicio para tu empresa"}
          </p>
        </div>
        {/* Paso indicator — solo visible si será catálogo */}
        {isCatalog(serviceType) && (
          <div className="flex items-center gap-2 text-xs font-semibold mt-1">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center">1</span>
            <span className="w-8 h-px bg-slate-200" />
            <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center">2</span>
          </div>
        )}
      </div>

      {/* Banners */}
      {isAgencia && (
        <div className="mb-5 px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-lg text-sm text-indigo-800">
          Como Agencia puedes reservar a nombre de terceros. La comisión del <strong>10%</strong> aplica sobre el valor del viaje ejecutado.
        </div>
      )}

      <form onSubmit={isCatalog(serviceType) ? handleSearch : handleDirectSubmit} className="space-y-6">

        {/* ── 1. Tipo de servicio ── */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Tipo de servicio <span className="text-red-500">*</span>
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SERVICES.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setServiceType(s.key)}
                className={`flex flex-col items-start p-3 rounded-lg border text-left transition-colors ${
                  serviceType === s.key
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <p className={`text-sm font-semibold ${serviceType === s.key ? "text-blue-700" : "text-slate-800"}`}>
                  {s.label}
                </p>
                <p className="text-xs text-slate-400 mt-0.5 leading-tight">{s.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* ── 2. Datos del solicitante ── */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
            {isAgencia ? "Datos del cliente" : "Datos del solicitante"}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Field label={isAgencia ? "Nombre del pasajero" : "Nombre del solicitante"} required>
              <input className={INPUT}
                value={isAgencia ? passengerName : requesterName}
                onChange={(e) => isAgencia ? setPassengerName(e.target.value) : setRequesterName(e.target.value)}
                placeholder={session!.user.nombre || "Nombre completo"} required />
            </Field>
            <Field label={isAgencia ? "Agente responsable" : "Departamento"}>
              <input className={INPUT}
                value={isAgencia ? requesterName : department}
                onChange={(e) => isAgencia ? setRequesterName(e.target.value) : setDepartment(e.target.value)}
                placeholder={isAgencia ? session!.user.nombre || "" : "Ej: Ventas, RRHH…"} />
            </Field>
          </div>

          {isGrande && !isCatalog(serviceType) && (
            <label className="flex items-center gap-3 mt-4 cursor-pointer select-none">
              <div
                onClick={() => setRequiresApproval((v) => !v)}
                className={`w-10 h-6 rounded-full transition-colors relative flex-shrink-0 ${requiresApproval ? "bg-amber-500" : "bg-slate-200"}`}
              >
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${requiresApproval ? "translate-x-5" : "translate-x-1"}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">Enviar para aprobación</p>
                <p className="text-xs text-slate-500">Se confirma solo tras autorización del aprobador</p>
              </div>
            </label>
          )}
        </div>

        {/* ── 3. Detalles según tipo ── */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
            {isCatalog(serviceType) ? "Criterios de búsqueda" : "Detalles del servicio"}
          </p>

          {/* TOUR — filtros catálogo */}
          {serviceType === "tour" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Ciudad / destino">
                  <input className={INPUT} value={searchCity} onChange={(e) => setSearchCity(e.target.value)}
                    placeholder="Ej: Quito, Cuenca, Galápagos" />
                </Field>
                <Field label="Categoría">
                  <select className={SELECT} value={searchCategory} onChange={(e) => setSearchCategory(e.target.value)}>
                    <option value="">Todas las categorías</option>
                    {TOUR_CATEGORIES.map((c) => (
                      <option key={c.key} value={c.key}>{c.label}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Precio máximo (USD)">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                  <input type="number" min="0" className={INPUT + " pl-7"} value={searchMaxPrice}
                    onChange={(e) => setSearchMaxPrice(e.target.value)} placeholder="Sin límite" />
                </div>
              </Field>
            </div>
          )}

          {/* ACCOMMODATION — filtros catálogo */}
          {serviceType === "accommodation" && (
            <div className="space-y-3">
              <Field label="Ciudad / destino" required>
                <input className={INPUT} value={searchCity} onChange={(e) => setSearchCity(e.target.value)}
                  placeholder="Ej: Cuenca, Guayaquil, Manta" required />
              </Field>
              <Field label="Capacidad mínima (personas)">
                <input type="number" min="1" className={INPUT} value={searchCapacity}
                  onChange={(e) => setSearchCapacity(e.target.value)} placeholder="Ej: 2" />
              </Field>
            </div>
          )}

          {/* EXPERIENCE — filtros catálogo */}
          {serviceType === "experience" && (
            <div className="space-y-3">
              <Field label="Ciudad">
                <input className={INPUT} value={searchCity} onChange={(e) => setSearchCity(e.target.value)}
                  placeholder="Ej: Quito, Baños, Otavalo" />
              </Field>
              <Field label="Precio máximo (USD)">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                  <input type="number" min="0" className={INPUT + " pl-7"} value={searchMaxPrice}
                    onChange={(e) => setSearchMaxPrice(e.target.value)} placeholder="Sin límite" />
                </div>
              </Field>
            </div>
          )}

          {/* TRANSPORT */}
          {serviceType === "transport" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Origen" required>
                  <AddressAutocomplete className={INPUT} value={origin} onChange={setOrigin}
                    placeholder="Dirección de recogida" required />
                </Field>
                <Field label="Destino" required>
                  <AddressAutocomplete className={INPUT} value={destination} onChange={setDestination}
                    placeholder="Dirección de llegada" required />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Fecha" required>
                  <input type="date" className={INPUT} value={startDate} min={today}
                    onChange={(e) => setStartDate(e.target.value)} required />
                </Field>
                <Field label="Hora">
                  <input type="time" className={INPUT} value={startTime}
                    onChange={(e) => setStartTime(e.target.value)} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Pasajeros">
                  <input type="number" min="1" max="50" className={INPUT} value={passengers}
                    onChange={(e) => setPassengers(e.target.value)} />
                </Field>
                <Field label="Vehículo">
                  <select className={SELECT} value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value as VehicleType)}>
                    {VEHICLES.map((v) => <option key={v.key} value={v.key}>{v.label} ({v.cap})</option>)}
                  </select>
                </Field>
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={roundTrip} onChange={(e) => setRoundTrip(e.target.checked)}
                  className="w-4 h-4 accent-blue-600" />
                <span className="text-sm text-slate-700">Incluir viaje de regreso</span>
              </label>
            </div>
          )}

          {/* PARCEL */}
          {serviceType === "parcel" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Dirección de recogida" required>
                  <AddressAutocomplete className={INPUT} value={parcelOrigin} onChange={setParcelOrigin}
                    placeholder="Origen" required />
                </Field>
                <Field label="Dirección de entrega" required>
                  <AddressAutocomplete className={INPUT} value={parcelDest} onChange={setParcelDest}
                    placeholder="Destino" required />
                </Field>
              </div>
              <Field label="Fecha de recogida" required>
                <input type="date" className={INPUT} value={startDate} min={today}
                  onChange={(e) => setStartDate(e.target.value)} required />
              </Field>
              <Field label="Descripción del contenido">
                <input className={INPUT} value={parcelDescription} onChange={(e) => setParcelDescription(e.target.value)}
                  placeholder="Ej: Documentos, 2 cajas, 3 kg…" />
              </Field>
            </div>
          )}
        </div>

        {/* ── 4. Importe + notas (solo directo) ── */}
        {!isCatalog(serviceType) && (
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Presupuesto y notas</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Monto estimado (USD)">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                  <input type="number" min="0" step="0.01" className={INPUT + " pl-7"} value={estimatedAmount}
                    onChange={(e) => setEstimatedAmount(e.target.value)} placeholder="0.00" />
                </div>
              </Field>
              <div className="flex items-end">
                <div className="text-xs text-slate-500 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5 w-full">
                  Tarifas corporativas Going App incluyen IVA y cargo B2B
                </div>
              </div>
            </div>
            <Field label="Notas adicionales">
              <textarea rows={2} className={INPUT + " resize-none"} value={notes} onChange={(e) => setNotes(e.target.value)}
                placeholder="Motivo del viaje, requerimientos especiales…" />
            </Field>
          </div>
        )}

        {/* ── Error ── */}
        {(searchError || submitError) && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
            {searchError || submitError}
          </div>
        )}

        {/* ── Acciones ── */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.push("/panel/viajes")}
            className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting || searching}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-60"
          >
            {searching
              ? "Buscando…"
              : submitting
              ? "Enviando…"
              : isCatalog(serviceType)
              ? "Buscar disponibilidad →"
              : requiresApproval
              ? "Enviar para aprobación"
              : "Confirmar solicitud"}
          </button>
        </div>
      </form>
    </div>
  );
}
