/**
 * GOING — Corredores interurbanos oficiales (paradas + duración).
 *
 * Fuente ÚNICA de la geometría de rutas compartidas. Reemplaza las dos copias
 * que vivían duplicadas en:
 *   - transport-service/src/api/driver-schedule.controller.ts (GOING_ROUTES)
 *   - libs/pricing/src/lib/pricing.service.ts (GOING_SHARED_ROUTES, @deprecated)
 *
 * IMPORTANTE: aquí NO viven precios. La tarifa de cada tramo es responsabilidad
 * de FARES (fares.ts), que es la tabla autoritativa confirmada con ops. Separar
 * geometría (corredores) de precio (FARES) evita el desajuste histórico donde
 * stopPrices y FARES diferían.
 *
 * `stops` y `stopCityIds` van en orden hacia Quito (último elemento = Quito).
 */

export interface Corridor {
  id: string;
  label: string;
  /** Etiquetas legibles de las paradas, en orden hacia Quito. */
  stops: string[];
  /** IDs de ciudad (claves FARES) alineados 1:1 con `stops`. */
  stopCityIds: string[];
  /** Duración estimada extremo a extremo (horas). */
  estimatedDurationH: number;
}

export const CORRIDORS: Corridor[] = [
  {
    id: 'sierra_centro',
    label: 'Sierra Centro → Quito',
    stops: ['Riobamba', 'Ambato', 'Latacunga', 'Quito'],
    stopCityIds: ['riobamba', 'ambato', 'latacunga', 'quito'],
    estimatedDurationH: 2.5,
  },
  {
    id: 'costa_quito',
    label: 'Costa → Quito',
    stops: ['El Carmen', 'La Concordia', 'Santo Domingo', 'Quito'],
    stopCityIds: ['el_carmen', 'la_concordia', 'santo_domingo', 'quito'],
    estimatedDurationH: 3.5,
  },
  {
    id: 'sierra_norte',
    label: 'Sierra Norte → Quito',
    // Arranca en Tulcán (frontera Carchi) — ruta de lanzamiento Going.
    stops: ['Tulcán', 'Ibarra', 'Otavalo', 'Quito'],
    stopCityIds: ['tulcan', 'ibarra', 'otavalo', 'quito'],
    estimatedDurationH: 4.5,
  },
];

export const CORRIDORS_BY_ID: Record<string, Corridor> = Object.fromEntries(
  CORRIDORS.map((c) => [c.id, c]),
);

/** Devuelve el corredor que conecta dos ciudades (en cualquier sentido), o null. */
export function findCorridorForCities(
  originCityId: string,
  destCityId: string,
): Corridor | null {
  for (const c of CORRIDORS) {
    const oi = c.stopCityIds.indexOf(originCityId);
    const di = c.stopCityIds.indexOf(destCityId);
    if (oi !== -1 && di !== -1) return c;
  }
  return null;
}
