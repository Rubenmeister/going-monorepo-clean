/**
 * Página de Cotización para Grupos
 * Ruta: /cotizacion
 *
 * Formulario para solicitar tarifa corporativa especial:
 *  - Grupos de +10 personas
 *  - Eventos corporativos
 *  - Traslados masivos
 *
 * Conectado a POST /corporate/quotes.
 * Muestra historial de cotizaciones previas vía GET /corporate/quotes.
 */

"use client";

import { useEffect, useState } from "react";
import { useAuthRedirect } from "@/lib/auth";
import { corpFetch } from "@/lib/api";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type QuoteStatus = "PENDING" | "IN_REVIEW" | "QUOTED" | "ACCEPTED" | "REJECTED" | "EXPIRED";

type ServiceType = "transport" | "accommodation" | "tour" | "experience" | "mixed";

interface Quote {
  id:          string;
  serviceType: ServiceType;
  groupSize:   number;
  eventName:   string;
  eventDate:   string;
  origin?:     string;
  destination?: string;
  city?:       string;
  notes?:      string;
  status:      QuoteStatus;
  proposedAmount?: number;
  currency:    string;
  createdAt:   string;
  expiresAt?:  string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<QuoteStatus, { bg: string; text: string; label: string }> = {
  PENDING:   { bg: "bg-slate-100",  text: "text-slate-600",  label: "Enviada" },
  IN_REVIEW: { bg: "bg-blue-100",   text: "text-blue-700",   label: "En revisión" },
  QUOTED:    { bg: "bg-indigo-100", text: "text-indigo-700", label: "Cotizada" },
  ACCEPTED:  { bg: "bg-green-100",  text: "text-green-700",  label: "Aceptada" },
  REJECTED:  { bg: "bg-red-100",    text: "text-red-600",    label: "Rechazada" },
  EXPIRED:   { bg: "bg-slate-100",  text: "text-slate-500",  label: "Vencida" },
};

const SERVICE_OPTIONS: { key: ServiceType; label: string; desc: string }[] = [
  { key: "transport",     label: "Traslado grupal",    desc: "Buses, vans o flota de vehículos" },
  { key: "accommodation", label: "Alojamiento grupal", desc: "Bloqueo de habitaciones en hotel" },
  { key: "tour",          label: "Tour grupal",         desc: "Excursión o city tour corporativo" },
  { key: "experience",    label: "Evento corporativo",  desc: "Team building, gala, conferencia" },
  { key: "mixed",         label: "Paquete completo",    desc: "Transporte + alojamiento + actividades" },
];

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("es-EC", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtMoney(n: number) {
  return `$${n.toLocaleString("es-EC", { minimumFractionDigits: 2 })}`;
}

const INPUT  = "w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white placeholder:text-slate-400";
const SELECT = INPUT + " cursor-pointer";
const today  = new Date().toISOString().split("T")[0];

// ─── Página ───────────────────────────────────────────────────────────────────

export default function CotizacionPage() {
  const { session } = useAuthRedirect();

  const [quotes,      setQuotes]      = useState<Quote[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [submitting,  setSubmitting]  = useState(false);
  const [submitOk,    setSubmitOk]    = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  // Formulario
  const [serviceType,   setServiceType]   = useState<ServiceType>("transport");
  const [groupSize,     setGroupSize]     = useState("10");
  const [eventName,     setEventName]     = useState("");
  const [eventDate,     setEventDate]     = useState("");
  const [origin,        setOrigin]        = useState("");
  const [destination,   setDestination]   = useState("");
  const [city,          setCity]          = useState("");
  const [budget,        setBudget]        = useState("");
  const [notes,         setNotes]         = useState("");
  const [contactName,   setContactName]   = useState("");
  const [contactPhone,  setContactPhone]  = useState("");

  // Alias no-nullable para callbacks async (TS no puede estrechar dentro de
  // closures async tras el early-return de abajo). El useEffect early-returns
  // si no hay token todavía.
  const accessToken = session?.accessToken ?? "";

  // Cargar historial
  useEffect(() => {
    if (!accessToken) return;
    corpFetch<Quote[] | { quotes: Quote[] }>("/corporate/quotes", accessToken, { silent401: true })
      .then((res) => setQuotes(Array.isArray(res) ? res : (res as any).quotes ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [accessToken]);

  if (!session) return null;

  // Enviar cotización
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const newQuote = await corpFetch<Quote>("/corporate/quotes", accessToken, {
        method: "POST",
        body: JSON.stringify({
          serviceType,
          groupSize:     parseInt(groupSize),
          eventName:     eventName.trim(),
          eventDate,
          origin:        origin.trim() || undefined,
          destination:   destination.trim() || undefined,
          city:          city.trim() || undefined,
          estimatedBudget: budget ? parseFloat(budget) : undefined,
          notes:         notes.trim() || undefined,
          contactName:   contactName.trim(),
          contactPhone:  contactPhone.trim() || undefined,
          companyId:     session!.user?.companyId,
          requestedBy:   session!.user?.id,
        }),
      });
      setQuotes((prev) => [newQuote, ...prev]);
      setSubmitOk(true);
      // Reset form
      setEventName(""); setEventDate(""); setOrigin(""); setDestination("");
      setCity(""); setBudget(""); setNotes(""); setContactPhone("");
      setTimeout(() => setSubmitOk(false), 5000);
    } catch (err: any) {
      setError(err.message ?? "No se pudo enviar la cotización. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  const showOriginDest = serviceType === "transport" || serviceType === "mixed";
  const showCity = serviceType === "accommodation" || serviceType === "tour" || serviceType === "experience" || serviceType === "mixed";

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Cotización para Grupos</h1>
        <p className="text-slate-600 mt-1">
          Solicita una tarifa corporativa especial para grupos de 10+ personas o eventos empresariales
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Formulario */}
        <div className="lg:col-span-3 bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 mb-5">Nueva solicitud de cotización</h2>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Tipo de servicio */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                Tipo de servicio *
              </label>
              <div className="grid grid-cols-1 gap-2">
                {SERVICE_OPTIONS.map((s) => (
                  <button key={s.key} type="button" onClick={() => setServiceType(s.key)}
                    className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ${
                      serviceType === s.key ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300"
                    }`}>
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${serviceType === s.key ? "text-blue-700" : "text-slate-800"}`}>{s.label}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{s.desc}</p>
                    </div>
                    {serviceType === s.key && (
                      <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Detalles básicos */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Nombre del evento *</label>
                <input className={INPUT} value={eventName} onChange={(e) => setEventName(e.target.value)}
                  placeholder="Ej: Convención anual 2026" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">N° de personas *</label>
                <input type="number" min="10" className={INPUT} value={groupSize}
                  onChange={(e) => setGroupSize(e.target.value)} placeholder="Mín. 10" required />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Fecha del evento *</label>
              <input type="date" className={INPUT} value={eventDate} min={today}
                onChange={(e) => setEventDate(e.target.value)} required />
            </div>

            {showOriginDest && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Origen</label>
                  <input className={INPUT} value={origin} onChange={(e) => setOrigin(e.target.value)}
                    placeholder="Punto de recogida" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Destino</label>
                  <input className={INPUT} value={destination} onChange={(e) => setDestination(e.target.value)}
                    placeholder="Punto de llegada" />
                </div>
              </div>
            )}

            {showCity && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Ciudad</label>
                <input className={INPUT} value={city} onChange={(e) => setCity(e.target.value)}
                  placeholder="Ej: Quito, Guayaquil, Cuenca" />
              </div>
            )}

            {/* Presupuesto + contacto */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Presupuesto estimado (USD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                  <input type="number" min="0" step="0.01" className={INPUT + " pl-7"} value={budget}
                    onChange={(e) => setBudget(e.target.value)} placeholder="Opcional" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Teléfono de contacto</label>
                <input className={INPUT} value={contactPhone} onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+593 9…" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Responsable del evento *</label>
              <input className={INPUT} value={contactName} onChange={(e) => setContactName(e.target.value)}
                placeholder="Nombre completo" required />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Descripción / requerimientos</label>
              <textarea rows={3} className={INPUT + " resize-none"} value={notes} onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe el evento, requerimientos especiales, itinerario aproximado, preferencias de servicio…" />
            </div>

            {error && (
              <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">{error}</div>
            )}
            {submitOk && (
              <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                ✅ Cotización enviada. Un ejecutivo de Going App te contactará en menos de 24 horas.
              </div>
            )}

            <button type="submit" disabled={submitting}
              className="w-full py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60">
              {submitting ? "Enviando solicitud…" : "Solicitar cotización"}
            </button>

            <p className="text-xs text-slate-400 text-center">
              Going App responde en &lt;24h hábiles con una propuesta personalizada y tarifa B2B
            </p>
          </form>
        </div>

        {/* Historial */}
        <div className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Historial de cotizaciones</h2>

          {loading && (
            <div className="space-y-3">
              {[1,2].map((i) => <div key={i} className="h-20 bg-white rounded-lg border border-slate-200 animate-pulse" />)}
            </div>
          )}

          {!loading && quotes.length === 0 && (
            <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
              <p className="text-slate-500 text-sm">Aún no hay cotizaciones enviadas.</p>
            </div>
          )}

          {!loading && quotes.length > 0 && (
            <div className="space-y-3">
              {quotes.map((q) => {
                const st = STATUS_STYLES[q.status] ?? STATUS_STYLES.PENDING;
                return (
                  <div key={q.id} className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 text-sm truncate">{q.eventName}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {q.groupSize} personas · {fmtDate(q.eventDate)}
                        </p>
                        {q.proposedAmount && (
                          <p className="text-xs font-semibold text-blue-700 mt-1">
                            Propuesta: {fmtMoney(q.proposedAmount)}
                          </p>
                        )}
                        <p className="text-xs text-slate-400 mt-1">Enviada: {fmtDate(q.createdAt)}</p>
                      </div>
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full flex-shrink-0 ${st.bg} ${st.text}`}>
                        {st.label}
                      </span>
                    </div>
                    {q.status === "QUOTED" && (
                      <div className="mt-3 flex gap-2">
                        <button className="flex-1 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700">
                          Aceptar propuesta
                        </button>
                        <button className="flex-1 py-1.5 border border-slate-200 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-50">
                          Negociar
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
