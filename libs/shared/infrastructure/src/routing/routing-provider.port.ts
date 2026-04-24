/**
 * IRoutingProvider — port para obtener distancia/duración real por carretera.
 *
 * El motor de precios depende de este contrato; los adapters concretos
 * (OSRM público, OSRM auto-hospedado, Mapbox Directions, Google Distance
 * Matrix) se inyectan con este símbolo.
 */

export const IRoutingProvider = Symbol('IRoutingProvider');

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface RouteResult {
  distanceKm: number;
  durationMinutes: number;
  /** Identifica qué adapter respondió, útil para logs y métricas. */
  provider: string;
  /** Cuando falla el adapter principal y usamos Haversine de emergencia. */
  fallback?: boolean;
}

export interface IRoutingProvider {
  /**
   * Devuelve distancia y duración de la ruta real por carretera.
   * Debe NO lanzar: en fallo retorna una aproximación con `fallback: true`.
   */
  route(origin: GeoPoint, destination: GeoPoint): Promise<RouteResult>;
}

/**
 * Haversine — distancia geodésica entre dos puntos (línea recta).
 * Útil como fallback cuando el proveedor de routing falla.
 *
 * Factor 1.3 sube la estimación para aproximarla a carretera real
 * (las carreteras no van en línea recta).
 */
export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const R = 6371; // radio medio de la Tierra en km
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}
