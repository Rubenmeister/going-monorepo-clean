/**
 * Cobertura compartida (mirror de `libs/pricing/src/lib/cities.ts`).
 *
 * Solo el subset necesario para validar cobertura compartida en el cliente.
 * Si la lista del backend cambia (radiusKm o ciudades), actualizar este
 * archivo en el mismo PR. El backend siempre tiene la última palabra (rechaza
 * el ride si está fuera), pero validar acá da UX mejor (botón deshabilitado +
 * mensaje claro antes de submit).
 */

export interface CityCentroid {
  id: string;
  label: string;
  lat: number;
  lng: number;
  radiusKm: number;
  isAirport?: boolean;
  smallTownNearHub?: boolean;
}

export const COVERAGE_CITIES: CityCentroid[] = [
  { id: 'quito',         label: 'Quito',              lat: -0.1807, lng: -78.4678, radiusKm: 18 },
  { id: 'aeropuerto',    label: 'Aeropuerto Tababela', lat: -0.1292, lng: -78.3575, radiusKm: 5, isAirport: true },
  { id: 'latacunga',     label: 'Latacunga',          lat: -0.9333, lng: -78.6167, radiusKm: 8  },
  { id: 'salcedo',       label: 'Salcedo',            lat: -1.0467, lng: -78.5917, radiusKm: 5, smallTownNearHub: true },
  { id: 'ambato',        label: 'Ambato',             lat: -1.2417, lng: -78.6197, radiusKm: 10 },
  { id: 'riobamba',      label: 'Riobamba',           lat: -1.6644, lng: -78.6544, radiusKm: 10 },
  { id: 'cayambe',       label: 'Cayambe',            lat:  0.0403, lng: -78.1456, radiusKm: 6, smallTownNearHub: true },
  { id: 'tabacundo',     label: 'Tabacundo',          lat:  0.0531, lng: -78.2331, radiusKm: 4, smallTownNearHub: true },
  { id: 'otavalo',       label: 'Otavalo',            lat:  0.2342, lng: -78.2611, radiusKm: 6  },
  { id: 'atuntaqui',     label: 'Atuntaqui',          lat:  0.3333, lng: -78.2167, radiusKm: 4, smallTownNearHub: true },
  { id: 'ibarra',        label: 'Ibarra',             lat:  0.3517, lng: -78.1222, radiusKm: 10 },
  { id: 'santo_domingo', label: 'Santo Domingo',      lat: -0.2533, lng: -79.1717, radiusKm: 12 },
  { id: 'la_concordia',  label: 'La Concordia',       lat: -0.0114, lng: -79.3925, radiusKm: 7, smallTownNearHub: true },
  { id: 'el_carmen',     label: 'El Carmen',          lat: -0.2667, lng: -79.4500, radiusKm: 7, smallTownNearHub: true },
];

/** Buffer compartido (km) sobre el radius de cada ciudad. */
export const SHARED_COVERAGE_BUFFER_KM = 5;

/** Distancia Haversine en km. */
export function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
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

/** Devuelve la ciudad más cercana si está dentro de radiusKm + bufferKm. */
export function resolveCityWithBuffer(
  lat: number,
  lng: number,
  bufferKm = SHARED_COVERAGE_BUFFER_KM,
): CityCentroid | null {
  let best: CityCentroid | null = null;
  let bestDist = Infinity;
  for (const c of COVERAGE_CITIES) {
    const d = haversineKm(lat, lng, c.lat, c.lng);
    if (d <= c.radiusKm + bufferKm && d < bestDist) {
      best = c;
      bestDist = d;
    }
  }
  return best;
}

/** True si el punto está dentro de la cobertura compartida (radio + buffer). */
export function isInSharedCoverage(
  lat: number,
  lng: number,
  bufferKm = SHARED_COVERAGE_BUFFER_KM,
): boolean {
  return resolveCityWithBuffer(lat, lng, bufferKm) !== null;
}
