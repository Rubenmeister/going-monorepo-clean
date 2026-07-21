/**
 * MIRROR de `libs/pricing/src/lib/route-suggester.ts`.
 *
 * Sugiere la ciudad-hub más cercana al destino cuando no hay ruta compartida
 * directa. Toma las tarifas del MOTOR (snapshot) y las ciudades de CITIES
 * (catalog/coverage.ts) — si esos cambian, el comportamiento se sincroniza
 * automáticamente sin tocar este archivo.
 *
 * Para actualizar este mirror: copiar la versión nueva de
 * `libs/pricing/src/lib/route-suggester.ts` reemplazando los imports por los
 * mirrors de `./fares` y `./coverage`.
 */
import { motorShared } from './motorSnapshot';

/**
 * Tarifa compartida entre dos ciudades, tomada del MOTOR.
 *
 * Antes salía de `catalog/fares.ts`, una copia local de 38 rutas congelada el
 * 6 de julio. Si el motor no está cargado devuelve null y el sugeridor deja de
 * proponer rutas, en vez de proponerlas con precios viejos.
 */
function tarifaCompartida(a: string, b: string): number | null {
  return motorShared(`${a}-${b}`.toLowerCase(), `${b}-${a}`.toLowerCase());
}
import {
  COVERAGE_CITIES,
  type CityCentroid,
  haversineKm,
  resolveCityWithBuffer,
} from './coverage';

export const MAX_LAST_LEG_KM = 60;

export interface DirectRoutePlan {
  kind: 'direct';
  originCityId: string;
  destinationCityId: string;
  price: number;
}

export interface NearestRoutePlan {
  kind: 'nearest';
  originCityId: string;
  hubCityId: string;
  hubLabel: string;
  lastLegKm: number;
  estimatedLastLegMinutes: number;
  price: number;
}

export interface NoSharedRoutePlan {
  kind: 'out_of_coverage' | 'no_shared_from_origin';
  reason: string;
  originCityId?: string;
}

export type SharedTripPlan = DirectRoutePlan | NearestRoutePlan | NoSharedRoutePlan;

export function suggestSharedTripPlan(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
): SharedTripPlan {
  const origin = resolveCityWithBuffer(originLat, originLng);
  if (!origin) {
    return {
      kind: 'out_of_coverage',
      reason:
        'El origen está fuera de las ciudades en las que Going opera. ' +
        'Considerá moverte a una ciudad con cobertura o solicitar un viaje Privado.',
    };
  }

  const destCity = resolveCityWithBuffer(destLat, destLng);
  if (destCity) {
    const directPrice = tarifaCompartida(origin.id, destCity.id);
    if (directPrice !== null) {
      return {
        kind: 'direct',
        originCityId: origin.id,
        destinationCityId: destCity.id,
        price: directPrice,
      };
    }
  }

  let best: { city: CityCentroid; price: number; distanceKm: number } | null = null;
  for (const candidate of COVERAGE_CITIES) {
    if (candidate.id === origin.id) continue;
    const price = tarifaCompartida(origin.id, candidate.id);
    if (price === null) continue;
    const distanceKm = haversineKm(destLat, destLng, candidate.lat, candidate.lng);
    if (!best || distanceKm < best.distanceKm) {
      best = { city: candidate, price, distanceKm };
    }
  }

  if (!best) {
    return {
      kind: 'no_shared_from_origin',
      originCityId: origin.id,
      reason: `Desde ${origin.label} no tenemos rutas compartidas activas a ningún destino.`,
    };
  }

  if (best.distanceKm > MAX_LAST_LEG_KM) {
    return {
      kind: 'out_of_coverage',
      originCityId: origin.id,
      reason:
        `El destino queda a ${Math.round(best.distanceKm)} km de ${best.city.label}, ` +
        `que es la ciudad con servicio más cercana. Es demasiado lejos como conexión — ` +
        'sugerimos un viaje Privado puerta a puerta.',
    };
  }

  const estimatedLastLegMinutes = Math.max(1, Math.round((best.distanceKm / 40) * 60));

  return {
    kind: 'nearest',
    originCityId: origin.id,
    hubCityId: best.city.id,
    hubLabel: best.city.label,
    lastLegKm: Math.round(best.distanceKm * 10) / 10,
    estimatedLastLegMinutes,
    price: best.price,
  };
}

// Marker para mantener el import.
