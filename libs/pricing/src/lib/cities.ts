/**
 * GOING — Catálogo canónico de ciudades / corredores operativos.
 *
 * Fuente ÚNICA de verdad para la resolución espacial del buscador unificado.
 * Los `id` de ciudad coinciden EXACTAMENTE con las claves normalizadas de
 * `FARES` (ver fares.ts → normalize()), para que la clasificación de ruta y la
 * tarifa siempre hablen el mismo idioma y no haya desajustes.
 *
 * Resolución v1: centroide + radio (km). Las ciudades de la Sierra/Costa están
 * a decenas de km entre sí, así que un círculo por ciudad clasifica urbano vs
 * interurbano de forma robusta. Si en el futuro necesitamos precisión de borde
 * (p. ej. polígonos de barrio), se reemplaza `resolveCity` por point-in-polygon
 * sin tocar el resto del buscador.
 *
 * Coordenadas = centroides aproximados [lat, lng] (no límites exactos).
 */

export interface CityCentroid {
  /** Coincide con las claves normalizadas de FARES (quito, ambato, aeropuerto…). */
  id: string;
  label: string;
  lat: number;
  lng: number;
  /** Radio de cobertura en km alrededor del centroide. */
  radiusKm: number;
  /** true = aeropuerto (corredor especial, tarifa de zona aeropuerto). */
  isAirport?: boolean;
  /**
   * true = población pequeña cercana a una urbe mayor. El usuario definió que
   * estas rutas interurbanas llevan un componente dinámico adicional sobre la
   * tarifa de mercado. El factor concreto se aplica en el motor de pricing.
   */
  smallTownNearHub?: boolean;
  region?: string;
}

/**
 * Catálogo operativo Quito + Sierra Centro/Norte + Corredor Costa.
 * Mantener `id` sincronizado con las claves de FARES.
 */
export const CITIES: CityCentroid[] = [
  // ── Quito metropolitano + aeropuerto ───────────────────────────────────────
  { id: 'quito',         label: 'Quito',              lat: -0.1807, lng: -78.4678, radiusKm: 18, region: 'Pichincha' },
  { id: 'aeropuerto',    label: 'Aeropuerto Tababela', lat: -0.1292, lng: -78.3575, radiusKm: 5, isAirport: true, region: 'Pichincha' },

  // ── Sierra Centro ───────────────────────────────────────────────────────────
  { id: 'latacunga',     label: 'Latacunga',          lat: -0.9333, lng: -78.6167, radiusKm: 8,  region: 'Cotopaxi' },
  { id: 'salcedo',       label: 'Salcedo',            lat: -1.0467, lng: -78.5917, radiusKm: 5,  region: 'Cotopaxi', smallTownNearHub: true },
  { id: 'ambato',        label: 'Ambato',             lat: -1.2417, lng: -78.6197, radiusKm: 10, region: 'Tungurahua' },
  { id: 'riobamba',      label: 'Riobamba',           lat: -1.6644, lng: -78.6544, radiusKm: 10, region: 'Chimborazo' },

  // ── Sierra Norte ──────────────────────────────────────────────────────────────
  { id: 'cayambe',       label: 'Cayambe',            lat:  0.0403, lng: -78.1456, radiusKm: 6,  region: 'Pichincha', smallTownNearHub: true },
  { id: 'tabacundo',     label: 'Tabacundo',          lat:  0.0531, lng: -78.2331, radiusKm: 4,  region: 'Pichincha', smallTownNearHub: true },
  { id: 'otavalo',       label: 'Otavalo',            lat:  0.2342, lng: -78.2611, radiusKm: 6,  region: 'Imbabura' },
  { id: 'atuntaqui',     label: 'Atuntaqui',          lat:  0.3333, lng: -78.2167, radiusKm: 4,  region: 'Imbabura', smallTownNearHub: true },
  { id: 'ibarra',        label: 'Ibarra',             lat:  0.3517, lng: -78.1222, radiusKm: 10, region: 'Imbabura' },

  // ── Corredor Costa (vía Santo Domingo) ──────────────────────────────────────
  { id: 'santo_domingo', label: 'Santo Domingo',      lat: -0.2533, lng: -79.1717, radiusKm: 12, region: 'Sto. Domingo' },
  { id: 'la_concordia',  label: 'La Concordia',       lat: -0.0114, lng: -79.3925, radiusKm: 7,  region: 'Sto. Domingo', smallTownNearHub: true },
  { id: 'el_carmen',     label: 'El Carmen',          lat: -0.2667, lng: -79.4500, radiusKm: 7,  region: 'Manabí', smallTownNearHub: true },
];

const CITIES_BY_ID: Record<string, CityCentroid> = Object.fromEntries(
  CITIES.map((c) => [c.id, c]),
);

export function getCity(id: string): CityCentroid | undefined {
  return CITIES_BY_ID[id];
}

/** Distancia Haversine en km entre dos puntos [lat, lng]. */
export function haversineKm(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): number {
  const R = 6371; // radio terrestre km
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Resuelve un punto a la ciudad MÁS CERCANA cuyo radio lo contenga.
 * Devuelve null si el punto cae fuera de toda zona de cobertura.
 *
 * Usar "más cercana" (no "primera dentro del radio") tolera radios solapados
 * entre poblaciones vecinas (ej. Otavalo/Atuntaqui): gana el centroide real.
 */
export function resolveCity(lat: number, lng: number): CityCentroid | null {
  let best: CityCentroid | null = null;
  let bestDist = Infinity;
  for (const c of CITIES) {
    const d = haversineKm(lat, lng, c.lat, c.lng);
    if (d <= c.radiusKm && d < bestDist) {
      best = c;
      bestDist = d;
    }
  }
  return best;
}

export type RouteClass = 'urban' | 'intercity' | 'airport_corridor' | 'out_of_coverage';

export interface RouteClassification {
  originCity: string | null;
  originLabel: string | null;
  destinationCity: string | null;
  destinationLabel: string | null;
  /** Cruza dos ciudades distintas (excluye corredor aeropuerto). */
  isIntercity: boolean;
  /** Alguno de los extremos es el aeropuerto. */
  isAirportCorridor: boolean;
  routeClass: RouteClass;
  /** Algún extremo es población pequeña cercana a urbe mayor. */
  smallTownLeg: boolean;
  /** Distancia punto-a-punto en km (real, no centroide). */
  distanceKm: number;
  estimatedDurationMinutes: number;
}

/** Velocidad media estimada por tipo de ruta (km/h). */
const AVG_SPEED_KMH: Record<Exclude<RouteClass, 'out_of_coverage'>, number> = {
  urban: 25,
  intercity: 65,
  airport_corridor: 55,
};

/**
 * Clasifica una ruta a partir de coordenadas de origen y destino.
 *
 * Reglas:
 *   - Si algún extremo no resuelve a ciudad → 'out_of_coverage'.
 *   - Si algún extremo es aeropuerto        → 'airport_corridor'.
 *   - Si las ciudades difieren              → 'intercity'.
 *   - Si es la misma ciudad                 → 'urban'.
 */
export function classifyRoute(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
): RouteClassification {
  const o = resolveCity(originLat, originLng);
  const d = resolveCity(destLat, destLng);
  const distanceKm = Math.round(haversineKm(originLat, originLng, destLat, destLng) * 10) / 10;
  const isAirportCorridor = !!(o?.isAirport || d?.isAirport);

  let routeClass: RouteClass;
  if (!o || !d) routeClass = 'out_of_coverage';
  else if (isAirportCorridor) routeClass = 'airport_corridor';
  else if (o.id !== d.id) routeClass = 'intercity';
  else routeClass = 'urban';

  const speed = routeClass === 'out_of_coverage' ? AVG_SPEED_KMH.intercity : AVG_SPEED_KMH[routeClass];
  const estimatedDurationMinutes = distanceKm > 0 ? Math.round((distanceKm / speed) * 60) : 0;

  return {
    originCity: o?.id ?? null,
    originLabel: o?.label ?? null,
    destinationCity: d?.id ?? null,
    destinationLabel: d?.label ?? null,
    isIntercity: routeClass === 'intercity',
    isAirportCorridor,
    routeClass,
    smallTownLeg: !!(o?.smallTownNearHub || d?.smallTownNearHub),
    distanceKm,
    estimatedDurationMinutes,
  };
}
