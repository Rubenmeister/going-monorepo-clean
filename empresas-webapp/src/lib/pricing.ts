/**
 * Tarifas corporativas — se consultan a `corporate-service`, NO al motor.
 *
 * El panel no le pide al operador que teclee el valor del viaje: la tarifa es la
 * que es. Y no cotiza contra el motor directamente, aunque sería más corto: el
 * recargo corporativo se NEGOCIA con cada empresa (puede ser 18% en transporte y
 * 30% en tours) y esa tasa la resuelve el servidor a partir de la sesión. Si el
 * navegador cotizara por su cuenta mostraría el recargo estándar mientras la
 * reserva cobra el negociado — precio mostrado distinto del cobrado.
 *
 * El precio corporativo ya NO es una lista aparte: es la tabla privada más el
 * recargo, aplicado al cotizar. Antes existía una lista `empresas` con los
 * valores premultiplicados; se eliminó porque los dos juegos de números se
 * desalineaban en silencio.
 *
 * Dos detalles del contrato, verificados contra producción:
 *  1. NO se normaliza el texto: hay que mandar el SLUG del lugar
 *     ("santo_domingo", no "Santo Domingo"; "Quito — Centro Norte" no matchea).
 *  2. La tarifa vive por PARES de lugares (124 pares, 46 lugares). Si la ruta no
 *     está en la tabla responde `cotizable: false`, y ahí el monto queda manual.
 */

import { API_BASE_URL } from "./constants";

/** Los 46 lugares de la tabla de tarifas (slug tal como lo espera el motor). */
export const FARE_PLACES: string[] = [
  "aeropuerto", "alausi", "aloasi", "ambato", "atuntaqui", "azogues", "banos",
  "cayambe", "cevallos", "cotacachi", "cuenca", "el_carmen", "el_quinche",
  "esmeraldas", "guaranda", "guayaquil", "guayllabamba", "ibarra",
  "la_concordia", "lago_agrio", "latacunga", "loja", "macas", "machachi",
  "machala", "manta", "mocha", "montanita", "naranjal", "otavalo", "peguche",
  "pifo", "pillaro", "portoviejo", "puyo", "quito", "riobamba", "salcedo",
  "salinas", "santo_domingo", "tabacundo", "tambillo", "tena", "tisaleo",
  "tulcan", "zaruma",
];

/** Quita acentos y baja a minúsculas para comparar direcciones libres. */
function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Mapea una dirección libre (la que escribe o autocompleta el usuario) al slug
 * del lugar tarifado. Devuelve null si no reconoce ninguno.
 *
 * Ej: "Quito — Centro Norte" → "quito"; "Cuenca, Azuay, Ecuador" → "cuenca";
 *     "Aeropuerto Mariscal Sucre" → "aeropuerto".
 */
export function placeSlugFromAddress(address: string): string | null {
  if (!address?.trim()) return null;
  const n = normalize(address);

  // El nodo "aeropuerto" de la tabla es el de Quito (Mariscal Sucre). Si la
  // dirección habla de OTRO aeropuerto (ej. Guayaquil/Olmedo), no lo forzamos:
  // cae al match por ciudad y, si no hay tarifa, el monto queda manual.
  if (/\baeropuerto\b/.test(n) && !/guayaquil|olmedo/.test(n)) return "aeropuerto";

  // Match por palabra completa; gana el nombre más largo (evita que "manta"
  // pise a un nombre compuesto que lo contenga).
  let best: string | null = null;
  for (const slug of FARE_PLACES) {
    if (slug === "aeropuerto") continue;
    const phrase = slug.replace(/_/g, " ");
    const re = new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
    if (re.test(n) && (!best || phrase.length > best.replace(/_/g, " ").length)) {
      best = slug;
    }
  }
  return best;
}

export interface FareQuote {
  total: number;
  base: number;
  currency: string;
  /** Lista del motor usada como base: siempre "privado" (el recargo va aparte). */
  list?: string;
  listVersion?: number | null;
  /** Paradas intermedias cobradas y su recargo (regla `stop_surcharge`). */
  stops?: number;
  stopSurchargeUnit?: number;
  stopSurchargeTotal?: number;
  /** Ida y regreso: el motor multiplicó la tarifa de ruta por este factor. */
  roundTrip?: boolean;
  roundTripMultiplier?: number;
  /** Recargo corporativo negociado con esta empresa (0.18 = +18%). */
  surchargeRate?: number | null;
}

export type QuoteOutcome =
  | { status: "ok"; quote: FareQuote; originSlug: string; destinationSlug: string }
  | { status: "unknown_place"; which: "origin" | "destination" }
  | { status: "no_fare" }
  | { status: "error" };

/**
 * Cotiza una ruta para la empresa de la sesión. El monto que devuelve es el
 * MISMO que cobrará la reserva: ambos caminos usan el cálculo del servidor.
 */
export async function quoteCorporateFare(params: {
  origin: string;
  destination: string;
  vehicleType: string;
  dateTime?: string;
  /**
   * Paradas INTERMEDIAS (sin contar origen ni destino final). En un viaje de
   * ida y regreso se cuentan las de AMBOS tramos: cada parada se cobra una vez.
   */
  stops?: number;
  /** Ida y regreso: el motor cobra la ruta dos veces (regla `round_trip`). */
  roundTrip?: boolean;
  /** Token de la sesión: el servidor resuelve con él la empresa y su tasa. */
  token?: string;
  /** transport | parcel | tour | accommodation | experience. */
  serviceType?: string;
  signal?: AbortSignal;
}): Promise<QuoteOutcome> {
  const originSlug = placeSlugFromAddress(params.origin);
  if (!originSlug) return { status: "unknown_place", which: "origin" };
  const destinationSlug = placeSlugFromAddress(params.destination);
  if (!destinationSlug) return { status: "unknown_place", which: "destination" };

  try {
    // Se cotiza CONTRA corporate-service, no contra el motor directamente.
    //
    // La tasa corporativa se negocia con cada empresa y la resuelve el servidor
    // a partir de la sesión. Si el navegador cotizara por su cuenta usaría el
    // recargo estándar y mostraría un precio distinto del que cobra la reserva
    // en cuanto la empresa tenga una tasa propia — precio mostrado ≠ cobrado.
    const res = await fetch(`${API_BASE_URL}/corporate/quote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(params.token ? { Authorization: `Bearer ${params.token}` } : {}),
      },
      signal: params.signal,
      body: JSON.stringify({
        serviceType: params.serviceType ?? "transport",
        startDate: params.dateTime,
        metadata: {
          origin: originSlug,
          destination: destinationSlug,
          vehicleType: params.vehicleType,
          stopCount: params.stops ?? 0,
          roundTrip: !!params.roundTrip,
        },
      }),
    });
    if (!res.ok) return { status: "error" };
    const json = await res.json();
    if (json?.cotizable === false) return { status: "no_fare" };
    if (typeof json?.amount !== "number") return { status: "no_fare" };
    const b = json.breakdown ?? {};
    return {
      status: "ok",
      originSlug,
      destinationSlug,
      quote: {
        total: json.amount,
        base: b.basePrice ?? json.amount,
        currency: json.currency ?? "USD",
        list: b.list,
        listVersion: b.listVersion ?? null,
        stops: b.stops ?? 0,
        stopSurchargeUnit: b.stopSurchargeUnit ?? 0,
        stopSurchargeTotal: b.stopSurchargeTotal ?? 0,
        roundTrip: !!b.roundTrip,
        roundTripMultiplier: b.roundTripMultiplier ?? 1,
        // Recargo corporativo REAL de esta empresa, ya negociado.
        surchargeRate: json.surchargeRate ?? b.clientSurchargeRate ?? null,
      },
    };
  } catch {
    return { status: "error" };
  }
}

/** Nombre legible de un slug, para mostrarlo en pantalla. */
export function placeLabel(slug: string): string {
  if (slug === "aeropuerto") return "Aeropuerto de Quito";
  return slug
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
