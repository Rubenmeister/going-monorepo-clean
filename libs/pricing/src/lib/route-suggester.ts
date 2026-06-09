/**
 * route-suggester — dado origen y destino reales, decide:
 *   1. Si Going Compartido cubre el trayecto directo (precio del par)
 *   2. Si no hay ruta directa, sugiere la ciudad-hub más cercana al destino
 *      desde donde SÍ se puede llegar en Compartido + estima el último tramo
 *      que el pasajero tiene que cubrir por su cuenta
 *   3. Si nada de eso aplica, devuelve "fuera de cobertura compartida"
 *
 * Ejemplo de uso (Quito → Zumbahua, Cotopaxi):
 *   Zumbahua NO está en la tabla, pero queda a ~37 km de Latacunga.
 *   La función devolverá `{ kind: 'nearest', hubCity: 'latacunga', lastLegKm: 37, ... }`
 *   para que la app/agente diga "Te llevamos a Latacunga (Compartido, $10)
 *   y desde ahí son ~55 min en transporte local hasta Zumbahua".
 */
import { FARES, getFare } from './fares';
import { CITIES, type CityCentroid, haversineKm, resolveCityWithBuffer } from './cities';

/**
 * Último tramo MÁXIMO (km) que aceptamos sugerirle al usuario que cubra
 * por su cuenta desde la ciudad-hub hasta el destino final. Más allá de
 * este radio el destino se trata como fuera de cobertura.
 */
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
  /** Ciudad-hub a donde el Compartido lleva al pasajero. */
  hubCityId: string;
  hubLabel: string;
  /** Distancia (km) del hub al destino real. */
  lastLegKm: number;
  /** Tiempo estimado del último tramo (min), ~40 km/h promedio en Sierra. */
  estimatedLastLegMinutes: number;
  /** Precio del compartido origen → hub. */
  price: number;
}

export interface NoSharedRoutePlan {
  kind: 'out_of_coverage' | 'no_shared_from_origin';
  reason: string;
  /** Si el origen sí estaba en cobertura pero no hay ruta utilizable. */
  originCityId?: string;
}

export type SharedTripPlan = DirectRoutePlan | NearestRoutePlan | NoSharedRoutePlan;

/**
 * Núcleo de la sugerencia. Trabaja con coordenadas (latitud/longitud) del
 * mundo real, no con IDs.
 */
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

  // 1) ¿El destino real cae dentro de la cobertura de alguna ciudad de FARES?
  const destCity = resolveCityWithBuffer(destLat, destLng);
  if (destCity) {
    const directPrice = getFare(origin.id, destCity.id);
    if (directPrice !== null) {
      return {
        kind: 'direct',
        originCityId: origin.id,
        destinationCityId: destCity.id,
        price: directPrice,
      };
    }
  }

  // 2) No hay ruta directa. Buscar la ciudad MÁS CERCANA al destino real que
  //    sí tenga par compartido desde el origen.
  let best: { city: CityCentroid; price: number; distanceKm: number } | null = null;
  for (const candidate of CITIES) {
    if (candidate.id === origin.id) continue;
    const price = getFare(origin.id, candidate.id);
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
        `que es la ciudad con servicio más cercana. Es demasiado lejos para que te lo recomendemos ` +
        'como conexión — sugerimos un viaje Privado puerta a puerta.',
    };
  }

  // ~40 km/h promedio sobre carretera de Sierra/Costa para transporte local.
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

/**
 * Helper: lista todas las ciudades-hub con par compartido desde un origen
 * dado, ordenadas por precio ascendente. Útil para que el agente o el
 * mobile muestren opciones cuando el usuario duda dónde se le puede dejar.
 */
export function listHubsReachableFrom(originId: string): Array<{
  cityId: string;
  label: string;
  price: number;
}> {
  const hubs: Array<{ cityId: string; label: string; price: number }> = [];
  for (const candidate of CITIES) {
    if (candidate.id === originId) continue;
    const price = getFare(originId, candidate.id);
    if (price === null) continue;
    hubs.push({ cityId: candidate.id, label: candidate.label, price });
  }
  return hubs.sort((a, b) => a.price - b.price);
}

// Marker para chequear que el módulo se compila contra el resto de la lib.
void FARES;
