/**
 * Tarifas corporativas — consulta al motor de precios (pricing-service).
 *
 * El panel NO debe pedirle al operador que teclee el valor del viaje: la tarifa
 * corporativa ya existe como tabla propia en el motor (lista `empresas`, que es
 * la privada +25% materializada como precio FIJO). Aquí la consultamos.
 *
 * Dos detalles del contrato del motor, verificados contra producción:
 *  1. NO normaliza el texto: hay que mandarle el SLUG del lugar
 *     ("santo_domingo", no "Santo Domingo"; "Quito — Centro Norte" no matchea).
 *  2. La tarifa vive por PARES de lugares (124 pares, 46 lugares). Si la ruta no
 *     está en la tabla responde { error }, y ahí el monto queda manual.
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
  /** Lista usada por el motor: debe ser "empresas" en el portal corporativo. */
  list?: string;
  listVersion?: number | null;
  /** Paradas intermedias cobradas y su recargo (regla `stop_surcharge`). */
  stops?: number;
  stopSurchargeUnit?: number;
  stopSurchargeTotal?: number;
}

export type QuoteOutcome =
  | { status: "ok"; quote: FareQuote; originSlug: string; destinationSlug: string }
  | { status: "unknown_place"; which: "origin" | "destination" }
  | { status: "no_fare" }
  | { status: "error" };

/**
 * Cotiza una ruta corporativa. segment='corporate' hace que el motor use la
 * lista `empresas` (verificado: Quito→Cuenca SUV = $343.75 con list "empresas",
 * frente a $275 de la lista privada).
 */
export async function quoteCorporateFare(params: {
  origin: string;
  destination: string;
  vehicleType: string;
  dateTime?: string;
  /** Paradas INTERMEDIAS (sin contar origen ni destino final). */
  stops?: number;
  signal?: AbortSignal;
}): Promise<QuoteOutcome> {
  const originSlug = placeSlugFromAddress(params.origin);
  if (!originSlug) return { status: "unknown_place", which: "origin" };
  const destinationSlug = placeSlugFromAddress(params.destination);
  if (!destinationSlug) return { status: "unknown_place", which: "destination" };

  try {
    const res = await fetch(`${API_BASE_URL}/price`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: params.signal,
      body: JSON.stringify({
        serviceType: "intercity_private",
        origin: originSlug,
        destination: destinationSlug,
        vehicleType: params.vehicleType,
        segment: "corporate",
        ...(params.stops ? { stops: params.stops } : {}),
        ...(params.dateTime ? { dateTime: params.dateTime } : {}),
      }),
    });
    if (!res.ok) return { status: "error" };
    const json = await res.json();
    if (json?.error || typeof json?.total !== "number") return { status: "no_fare" };
    return {
      status: "ok",
      originSlug,
      destinationSlug,
      quote: {
        total: json.total,
        base: json.base,
        currency: json.currency ?? "USD",
        list: json?.breakdown?.list,
        listVersion: json.listVersion ?? null,
        stops: json?.breakdown?.stops ?? 0,
        stopSurchargeUnit: json?.breakdown?.stopSurchargeUnit ?? 0,
        stopSurchargeTotal: json?.breakdown?.stopSurchargeTotal ?? 0,
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
