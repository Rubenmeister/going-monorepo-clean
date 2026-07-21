/**
 * Página de Solicitar Viaje — Wizard 2 pasos
 * Ruta: /solicitar
 *
 * Paso 1: Tipo de servicio + criterios de búsqueda / detalles
 * Paso 2: Resultados del catálogo para seleccionar (tour / alojamiento / experiencia)
 *         Transport y Parcel van directo a confirmación.
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthRedirect } from "@/lib/auth";
import AddressAutocomplete, { rememberAddress } from "@/components/AddressAutocomplete";
import { quoteCorporateFare, placeLabel, type QuoteOutcome } from "@/lib/pricing";
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
/**
 * Vehículos EXACTAMENTE como los tarifa el motor (lista `empresas`).
 * Antes el formulario ofrecía "sedan", que NO existe en la tabla: el motor caía
 * a SUV y se cobraba precio de SUV sin avisar. Y faltaban suv_xl / van_xl /
 * bus / bus_40, que sí están tarifados.
 */
type VehicleType = "suv" | "suv_xl" | "van" | "van_xl" | "minibus" | "bus" | "bus_40";

/**
 * Tipo de viaje — se elige ANTES de cargar los lugares.
 *
 * Solo describe si el viaje VUELVE o no. Las paradas intermedias NO son un tipo
 * de viaje: son un agregado independiente, disponible tanto en solo ida como en
 * ida y regreso (antes eran excluyentes, así que pedir Quito→Santo Domingo ida y
 * regreso CON paradas era imposible).
 */
type TripType = "ida" | "ida_vuelta";

/** Punto intermedio de un viaje con paradas: lugar + cuándo. */
interface Stop {
  address: string;
  date: string;
  time: string;
}

/** Envío: a un solo destino, o distribución de varios paquetes a varios puntos. */
type ParcelMode = "single" | "multi";

/** Punto de entrega de una distribución: dónde, qué y para quién. */
interface Drop {
  address: string;
  description: string;
  contact: string;
}
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

const TRIP_TYPES: { key: TripType; label: string; desc: string }[] = [
  { key: "ida",        label: "Solo ida",      desc: "Un trayecto" },
  { key: "ida_vuelta", label: "Ida y regreso", desc: "Se cobran los dos trayectos" },
];

const PARCEL_MODES: { key: ParcelMode; label: string; desc: string }[] = [
  { key: "single", label: "Un destino",     desc: "Recogida → una entrega" },
  { key: "multi",  label: "Varios destinos", desc: "Distribución en ruta" },
];

/** maxPax se usa además para avisar si los pasajeros no caben en el vehículo. */
const VEHICLES: { key: VehicleType; label: string; cap: string; maxPax: number }[] = [
  { key: "suv",     label: "SUV",     cap: "hasta 4 pax",   maxPax: 4 },
  { key: "suv_xl",  label: "SUV XL",  cap: "hasta 5 pax",   maxPax: 5 },
  { key: "van",     label: "Van",     cap: "hasta 7 pax",   maxPax: 7 },
  { key: "van_xl",  label: "Van XL",  cap: "hasta 12 pax",  maxPax: 12 },
  { key: "minibus", label: "Minibús", cap: "hasta 20 pax",  maxPax: 20 },
  { key: "bus",     label: "Bus",     cap: "21 a 30 pax",   maxPax: 30 },
  { key: "bus_40",  label: "Bus 40",  cap: "40 o más pax",  maxPax: 99 },
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

/**
 * Editor de paradas intermedias de UN tramo.
 *
 * Existe como componente porque un viaje de ida y regreso tiene dos tramos y
 * cada uno puede parar en lugares distintos — se puede pasar por Alóag al ir y
 * por otro punto al volver. Antes las paradas eran un "tipo de viaje" excluyente
 * con el ida y regreso, así que esa combinación no se podía ni pedir.
 */
function StopList({
  titulo,
  stops,
  setStops,
  minDate,
  recargoUnitario,
}: {
  titulo: string;
  stops: Stop[];
  setStops: (s: Stop[]) => void;
  minDate: string;
  recargoUnitario?: number;
}) {
  const editar = (i: number, campo: keyof Stop, valor: string) =>
    setStops(stops.map((x, j) => (j === i ? { ...x, [campo]: valor } : x)));

  return (
    <div className="space-y-3 border-l-2 border-amber-200 pl-3">
      <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">{titulo}</p>
      <p className="text-xs text-slate-500">
        Opcional. Lugares por los que debe pasar en este tramo.{" "}
        <span className="text-amber-700 font-medium">
          Cada parada suma un recargo a la tarifa de ruta
          {!!recargoUnitario && ` ($${recargoUnitario.toFixed(2)} por parada)`}.
        </span>
      </p>

      {stops.map((s, i) => (
        <div key={i} className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500">Parada {i + 1}</p>
            <button
              type="button"
              onClick={() => setStops(stops.filter((_, j) => j !== i))}
              className="text-xs text-red-600 hover:underline font-medium"
            >
              Quitar
            </button>
          </div>
          <AddressAutocomplete
            className={INPUT}
            value={s.address}
            onChange={(v) => editar(i, "address", v)}
            placeholder="Lugar de la parada"
          />
          <div className="grid grid-cols-2 gap-3">
            <input type="date" className={INPUT} value={s.date} min={minDate}
              onChange={(e) => editar(i, "date", e.target.value)} />
            <input type="time" className={INPUT} value={s.time}
              onChange={(e) => editar(i, "time", e.target.value)} />
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => setStops([...stops, { address: "", date: "", time: "" }])}
        className="w-full py-2 border border-dashed border-slate-300 rounded-lg text-sm font-medium text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
      >
        + Agregar parada
      </button>
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
  const isNegocio  = tipoCuenta === "negocio";

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
  const [vehicleType, setVehicleType] = useState<VehicleType>("suv");

  // Tipo de viaje: se define ANTES de los lugares. Dos ejes independientes —
  // si vuelve o no (tripType), y qué paradas tiene cada tramo (stops por ida,
  // returnStops por regreso). Cada parada se cobra una vez, en el tramo donde
  // esté; el multiplicador de ida y regreso solo afecta la tarifa de ruta.
  const [tripType, setTripType]       = useState<TripType>("ida");
  const [returnDate, setReturnDate]   = useState("");
  const [returnTime, setReturnTime]   = useState("");
  const [stops, setStops]             = useState<Stop[]>([]);
  const [returnStops, setReturnStops] = useState<Stop[]>([]);

  // ── Encomienda ────────────────────────────────────────────────────────────
  const [parcelOrigin, setParcelOrigin]       = useState("");
  const [parcelDest, setParcelDest]           = useState("");
  const [parcelDescription, setParcelDescription] = useState("");

  // Distribución: un envío con varios paquetes que se reparten en varios puntos.
  // Capturar los puntos es el prerequisito del batching/optimización de ruta.
  const [parcelMode, setParcelMode] = useState<ParcelMode>("single");
  const [drops, setDrops]           = useState<Drop[]>([]);

  // ── Importe ───────────────────────────────────────────────────────────────
  const [estimatedAmount, setEstimatedAmount] = useState("");

  // ── Tarifa corporativa automática ─────────────────────────────────────────
  // El valor no debe teclearlo quien opera: sale de la tabla corporativa del
  // motor de tarifas. Si la ruta no está tarifada, el campo queda manual.
  const [fareQuote, setFareQuote] = useState<QuoteOutcome | null>(null);
  const [quoting, setQuoting]     = useState(false);
  const fareAbort                 = useRef<AbortController | null>(null);

  // ── Catálogo paso 2 ───────────────────────────────────────────────────────
  const [catalogResults, setCatalogResults] = useState<CatalogItem[]>([]);
  const [selectedItem, setSelectedItem]     = useState<CatalogItem | null>(null);
  const [searching, setSearching]           = useState(false);
  const [searchError, setSearchError]       = useState<string | null>(null);

  // ── Submit final ──────────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess]        = useState(false);

  // Paradas efectivamente cobrables: las que tienen dirección, de ida y —si el
  // viaje vuelve— de regreso.
  const outboundStops = stops.filter((s) => s.address.trim());
  const inboundStops  = tripType === "ida_vuelta" ? returnStops.filter((s) => s.address.trim()) : [];
  const countedStops  = outboundStops.length + inboundStops.length;

  // Cotiza al motor cuando cambia la ruta o el vehículo (con debounce, para no
  // pegarle en cada tecla del autocompletado).
  useEffect(() => {
    if (serviceType !== "transport" || !origin.trim() || !destination.trim()) {
      setFareQuote(null);
      return;
    }
    const t = setTimeout(async () => {
      fareAbort.current?.abort();
      const ctrl = new AbortController();
      fareAbort.current = ctrl;
      setQuoting(true);
      const out = await quoteCorporateFare({
        origin,
        destination,
        vehicleType,
        // Paradas de AMBOS tramos: cada una se cobra una vez, esté en la ida o
        // en el regreso. Solo cuentan las que tienen dirección cargada.
        stops: countedStops,
        // El motor multiplica la tarifa de ruta (regla `round_trip`). Antes esto
        // no se enviaba: la pantalla decía "por trayecto" y facturaba UNO SOLO.
        roundTrip: tripType === "ida_vuelta",
        dateTime: startDate ? `${startDate}T${startTime || "00:00"}:00` : undefined,
        // El servidor resuelve la empresa y su tasa negociada con este token.
        token: session?.accessToken,
        serviceType: "transport",
        signal: ctrl.signal,
      });
      setQuoting(false);
      setFareQuote(out);
      // La tarifa de la tabla manda; el campo queda editable como excepción.
      if (out.status === "ok") setEstimatedAmount(String(out.quote.total));
    }, 600);
    return () => clearTimeout(t);
  }, [serviceType, origin, destination, vehicleType, startDate, startTime, tripType, countedStops]);

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
    // Ida y regreso: el fin del viaje es la fecha/hora de regreso que cargó el
    // solicitante (antes se inventaba "el día siguiente", que no reservaba nada).
    // Con paradas: el fin es la última parada con fecha.
    const isoEnd = (() => {
      if (tripType === "ida_vuelta" && returnDate) {
        return `${returnDate}T${returnTime || "00:00"}:00`;
      }
      // Solo ida con paradas: el viaje termina en la última parada con fecha.
      const last = [...outboundStops].reverse().find((s) => s.date);
      if (last) return `${last.date}T${last.time || "00:00"}:00`;
      return undefined;
    })();

    const meta: Record<string, unknown> = {
      requesterName: requesterName || session!.user.nombre,
      department,
      requiresApproval,
      ...(isAgencia && { passengerName }),
    };
    if (serviceType === "transport") {
      Object.assign(meta, {
        origin, destination, passengers: +passengers, vehicleType,
        tripType,
        // Compatibilidad con consumidores que ya leían roundTrip.
        roundTrip: tripType === "ida_vuelta",
        ...(tripType === "ida_vuelta" && { returnDate, returnTime }),
        // Paradas por tramo: quien opere el viaje necesita saber DÓNDE para,
        // y en cuál de los dos trayectos.
        ...(outboundStops.length && { stops: outboundStops }),
        ...(inboundStops.length && { returnStops: inboundStops }),
        ...(countedStops && { stopCount: countedStops }),
      });
      rememberAddress(origin); rememberAddress(destination);
      [...outboundStops, ...inboundStops].forEach((s) => rememberAddress(s.address));
    } else {
      const cleanDrops = drops.filter((d) => d.address.trim());
      Object.assign(meta, {
        origin: parcelOrigin,
        // En distribución no hay UN destino: se resume y el detalle va en drops[].
        destination: parcelMode === "multi" ? `${cleanDrops.length} destinos` : parcelDest,
        description: parcelDescription,
        parcelMode,
        ...(parcelMode === "multi" && { drops: cleanDrops, dropCount: cleanDrops.length }),
      });
      rememberAddress(parcelOrigin);
      if (parcelMode === "multi") cleanDrops.forEach((d) => rememberAddress(d.address));
      else rememberAddress(parcelDest);
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

      {/* Banners contextuales por tipo de cuenta (Fase 6) */}
      {isAgencia && (
        <div className="mb-5 px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-lg text-sm text-indigo-800">
          Como Agencia puedes reservar a nombre de terceros. La comisión del <strong>10%</strong> aplica sobre el valor del viaje ejecutado.
        </div>
      )}
      {isGrande && (
        <div className="mb-5 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
          <strong>Empresa Grande</strong> · Facturación a crédito (40 días). Los viajes que superen el umbral o la política de tu empresa —o los que marques como <strong>“Enviar para aprobación”</strong>— pasan por <strong>aprobación multinivel</strong> antes de confirmarse.
        </div>
      )}
      {isNegocio && (
        <div className="mb-5 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800">
          <strong>Negocio/PyME</strong> · Pago por viaje (inmediato), sin aprobaciones ni línea de crédito. Cada solicitud se coordina y factura al confirmarse.
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
            <div className="space-y-4">

              {/* ── Tipo de viaje — se define ANTES de los lugares ── */}
              <div>
                <p className="text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Tipo de viaje <span className="text-red-500">*</span>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {TRIP_TYPES.map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setTripType(t.key)}
                      className={`p-2.5 rounded-lg border text-left transition-colors ${
                        tripType === t.key
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <p className={`text-sm font-semibold ${tripType === t.key ? "text-blue-700" : "text-slate-800"}`}>
                        {t.label}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5 leading-tight">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Salida ── */}
              <div className="space-y-3 border-l-2 border-blue-200 pl-3">
                <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">🟢 Salida</p>
                <Field label="Origen" required>
                  <AddressAutocomplete className={INPUT} value={origin} onChange={setOrigin}
                    placeholder="Dirección de recogida" required />
                </Field>
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
              </div>

              {/* ── Paradas de la ida — disponibles siempre, vuelva o no ── */}
              <StopList
                titulo="🟡 Paradas intermedias — ida"
                stops={stops}
                setStops={setStops}
                minDate={startDate || today}
                recargoUnitario={
                  fareQuote?.status === "ok" ? fareQuote.quote.stopSurchargeUnit : undefined
                }
              />

              {/* ── Llegada ── */}
              <div className="space-y-3 border-l-2 border-red-200 pl-3">
                <p className="text-xs font-bold text-red-700 uppercase tracking-wide">
                  🔴 {outboundStops.length ? "Destino final" : "Llegada"}
                </p>
                <Field label="Destino" required>
                  <AddressAutocomplete className={INPUT} value={destination} onChange={setDestination}
                    placeholder="Dirección de llegada" required />
                </Field>
              </div>

              {/* ── Regreso (solo ida y vuelta) — con sus propias paradas ── */}
              {tripType === "ida_vuelta" && (
                <div className="space-y-3 border-l-2 border-green-200 pl-3">
                  <p className="text-xs font-bold text-green-700 uppercase tracking-wide">
                    🔄 Regreso — del destino al origen
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Fecha de regreso" required>
                      <input type="date" className={INPUT} value={returnDate} min={startDate || today}
                        onChange={(e) => setReturnDate(e.target.value)} required />
                    </Field>
                    <Field label="Hora de regreso">
                      <input type="time" className={INPUT} value={returnTime}
                        onChange={(e) => setReturnTime(e.target.value)} />
                    </Field>
                  </div>

                  {/* El regreso puede parar en lugares distintos a los de la ida. */}
                  <StopList
                    titulo="🟡 Paradas intermedias — regreso"
                    stops={returnStops}
                    setStops={setReturnStops}
                    minDate={returnDate || startDate || today}
                    recargoUnitario={
                      fareQuote?.status === "ok" ? fareQuote.quote.stopSurchargeUnit : undefined
                    }
                  />
                </div>
              )}

              {/* ── Vehículo y pasajeros ── */}
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

              {/* El vehículo define la tarifa: avisar si los pasajeros no caben. */}
              {(() => {
                const v = VEHICLES.find((x) => x.key === vehicleType);
                const pax = parseInt(passengers) || 0;
                if (!v || pax <= v.maxPax) return null;
                const sugerido = VEHICLES.find((x) => pax <= x.maxPax);
                return (
                  <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    {pax} pasajeros no caben en {v.label} ({v.cap}).
                    {sugerido && ` Considera ${sugerido.label} (${sugerido.cap}).`}
                  </p>
                );
              })()}
            </div>
          )}

          {/* PARCEL */}
          {serviceType === "parcel" && (
            <div className="space-y-4">

              {/* ── Tipo de envío — un destino o distribución ── */}
              <div>
                <p className="text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Tipo de envío <span className="text-red-500">*</span>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {PARCEL_MODES.map((m) => (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => setParcelMode(m.key)}
                      className={`p-2.5 rounded-lg border text-left transition-colors ${
                        parcelMode === m.key
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <p className={`text-sm font-semibold ${parcelMode === m.key ? "text-blue-700" : "text-slate-800"}`}>
                        {m.label}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5 leading-tight">{m.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Recogida ── */}
              <div className="space-y-3 border-l-2 border-blue-200 pl-3">
                <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">📦 Recogida</p>
                <Field label="Dirección de recogida" required>
                  <AddressAutocomplete className={INPUT} value={parcelOrigin} onChange={setParcelOrigin}
                    placeholder="Origen" required />
                </Field>
                <Field label="Fecha de recogida" required>
                  <input type="date" className={INPUT} value={startDate} min={today}
                    onChange={(e) => setStartDate(e.target.value)} required />
                </Field>
              </div>

              {/* ── Entrega única ── */}
              {parcelMode === "single" && (
                <div className="space-y-3 border-l-2 border-red-200 pl-3">
                  <p className="text-xs font-bold text-red-700 uppercase tracking-wide">📍 Entrega</p>
                  <Field label="Dirección de entrega" required>
                    <AddressAutocomplete className={INPUT} value={parcelDest} onChange={setParcelDest}
                      placeholder="Destino" required />
                  </Field>
                  <Field label="Descripción del contenido">
                    <input className={INPUT} value={parcelDescription}
                      onChange={(e) => setParcelDescription(e.target.value)}
                      placeholder="Ej: Documentos, 2 cajas, 3 kg…" />
                  </Field>
                </div>
              )}

              {/* ── Distribución a varios puntos ── */}
              {parcelMode === "multi" && (
                <div className="space-y-3 border-l-2 border-amber-200 pl-3">
                  <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">
                    🚚 Puntos de entrega {drops.length > 0 && `· ${drops.length}`}
                  </p>
                  <Field label="Descripción general de la carga">
                    <input className={INPUT} value={parcelDescription}
                      onChange={(e) => setParcelDescription(e.target.value)}
                      placeholder="Ej: 12 cajas de catálogos, 40 kg en total" />
                  </Field>

                  {drops.length === 0 && (
                    <p className="text-xs text-slate-400">
                      Agrega cada punto de entrega con su paquete. Going App organiza la ruta de reparto.
                    </p>
                  )}

                  {drops.map((d, i) => (
                    <div key={i} className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-slate-500">Entrega {i + 1}</p>
                        <button
                          type="button"
                          onClick={() => setDrops(drops.filter((_, j) => j !== i))}
                          className="text-xs text-red-600 hover:underline font-medium"
                        >
                          Quitar
                        </button>
                      </div>
                      <AddressAutocomplete
                        className={INPUT}
                        value={d.address}
                        onChange={(v) => setDrops(drops.map((x, j) => (j === i ? { ...x, address: v } : x)))}
                        placeholder="Dirección de entrega"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <input className={INPUT} value={d.description}
                          onChange={(e) => setDrops(drops.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))}
                          placeholder="Paquete (ej: 2 cajas)" />
                        <input className={INPUT} value={d.contact}
                          onChange={(e) => setDrops(drops.map((x, j) => (j === i ? { ...x, contact: e.target.value } : x)))}
                          placeholder="Quién recibe (opcional)" />
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => setDrops([...drops, { address: "", description: "", contact: "" }])}
                    className="w-full py-2 border border-dashed border-slate-300 rounded-lg text-sm font-medium text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
                  >
                    + Agregar punto de entrega
                  </button>

                  <p className="text-xs text-slate-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                    Una sola recogida, varias entregas. Going App agrupa y ordena el reparto según las
                    direcciones cargadas.{" "}
                    <span className="font-medium text-amber-800">
                      La primera entrega va incluida en la tarifa; cada dirección adicional suma un
                      recargo (USD 5,00).
                    </span>
                    {drops.filter((d) => d.address.trim()).length > 1 && (
                      <span className="block mt-1 text-amber-900 font-semibold">
                        {drops.filter((d) => d.address.trim()).length - 1} dirección
                        {drops.filter((d) => d.address.trim()).length - 1 !== 1 ? "es" : ""} adicional
                        {drops.filter((d) => d.address.trim()).length - 1 !== 1 ? "es" : ""} · +$
                        {((drops.filter((d) => d.address.trim()).length - 1) * 5).toFixed(2)}
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── 4. Importe + notas (solo directo) ── */}
        {!isCatalog(serviceType) && (
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Presupuesto y notas</p>

            {/* Tarifa corporativa traída del motor (solo transporte) */}
            {serviceType === "transport" && quoting && (
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="w-4 h-4 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
                <p className="text-sm text-slate-500">Consultando tarifa corporativa…</p>
              </div>
            )}

            {serviceType === "transport" && !quoting && fareQuote?.status === "ok" && (
              <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                  <p className="text-sm font-semibold text-green-900">Tarifa corporativa</p>
                  <p className="text-2xl font-bold text-green-700">
                    ${fareQuote.quote.total.toLocaleString("es-EC", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <p className="text-xs text-green-800 mt-1">
                  {placeLabel(fareQuote.originSlug)} → {placeLabel(fareQuote.destinationSlug)} ·{" "}
                  {VEHICLES.find((v) => v.key === vehicleType)?.label ?? vehicleType}
                  {/* Lo dicta el MOTOR, no el formulario: si el motor todavía no
                      aplica el multiplicador, la pantalla no puede prometer que
                      el monto cubre los dos trayectos. */}
                  {fareQuote.quote.roundTrip && " · ida y regreso (total)"}
                </p>

                {/* Desglose cuando hay recargo por paradas o cobro de regreso —
                    todo lo que sube el precio debe verse, no solo el total. */}
                {(!!fareQuote.quote.stopSurchargeTotal || fareQuote.quote.roundTrip) && (
                  <div className="mt-2 pt-2 border-t border-green-200 space-y-0.5">
                    <div className="flex justify-between text-xs text-green-800">
                      <span>
                        Tarifa de ruta
                        {fareQuote.quote.roundTrip &&
                          ` (×${fareQuote.quote.roundTripMultiplier} por ida y regreso)`}
                      </span>
                      <span>${(fareQuote.quote.total - (fareQuote.quote.stopSurchargeTotal ?? 0)).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-green-800">
                      <span>
                        {fareQuote.quote.stops} parada{fareQuote.quote.stops !== 1 ? "s" : ""} intermedia
                        {fareQuote.quote.stops !== 1 ? "s" : ""} × ${fareQuote.quote.stopSurchargeUnit?.toFixed(2)}
                      </span>
                      <span>+${fareQuote.quote.stopSurchargeTotal?.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                <p className="text-xs text-green-700/70 mt-1">
                  Precio de la tabla corporativa de tu empresa. Puedes ajustarlo abajo si hay una
                  excepción acordada.
                </p>
              </div>
            )}

            {serviceType === "transport" && !quoting && fareQuote &&
              (fareQuote.status === "no_fare" || fareQuote.status === "unknown_place") && (
              <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm font-semibold text-amber-900">Ruta sin tarifa fija</p>
                <p className="text-xs text-amber-800 mt-1">
                  {fareQuote.status === "unknown_place"
                    ? `No reconocemos ${fareQuote.which === "origin" ? "el origen" : "el destino"} dentro de las rutas tarifadas.`
                    : "Esta combinación de origen y destino no está en la tabla corporativa."}{" "}
                  Escribe el monto acordado y Going App lo confirma al coordinar el servicio.
                </p>
              </div>
            )}

            <Field label="Monto (USD)">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                <input type="number" min="0" step="0.01" className={INPUT + " pl-7"} value={estimatedAmount}
                  onChange={(e) => setEstimatedAmount(e.target.value)} placeholder="0.00" />
              </div>
              <p className="text-xs text-slate-400 mt-1.5">
                {serviceType === "transport" && fareQuote?.status === "ok"
                  ? "Traído de la tabla corporativa. Edítalo solo si hay una excepción acordada."
                  : "Lo define tu empresa según la tarifa acordada."}
              </p>
            </Field>
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
