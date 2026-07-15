/**
 * driver-scoring — el algoritmo de puntaje ÚNICO para asignar conductor a un
 * recorrido (decisión Rubén 6-jul: el scoring es la base de TODA asignación:
 * preliminar al reservar, definitivo el día anterior y reasignaciones).
 *
 * Función PURA (sin DB/DI) → testeable y reusable. El servicio que reúne los
 * datos (agendas comprometidas + viajes del día + rating + disponibilidad) le
 * pasa los candidatos ya armados y esta función los rankea.
 *
 * Factores v1 (afinables por los pesos W):
 *   - EQUIDAD: menos viajes hechos hoy → mejor (reparte el trabajo/ingresos).
 *   - PROXIMIDAD: más cerca de la zona de salida → mejor.
 *   - RATING: mejor calificación → desempata.
 * Reusa lo que el matcher inmediato ya evalúa (proximidad + rating +
 * disponibilidad); lo NUEVO es la equidad por número de viajes.
 */

export interface DriverCandidate {
  driverId: string;
  /** Viajes ya realizados hoy — factor de EQUIDAD (menos = mejor). */
  tripsToday: number;
  /** Calificación promedio 0–5. */
  rating: number;
  /** Distancia (km) a la zona de salida; null si desconocida. */
  distanceKm: number | null;
  /** ¿Disponible? (online / ventana de agenda / no en descanso / sin solape). */
  available: boolean;
  /**
   * Nivel de la Academia Going App: 0=sin nivel, 1=Bronce, 2=Plata, 3=Oro.
   * Factor OPCIONAL — si el enriquecimiento está apagado o academy-service no
   * responde, llega undefined y NO afecta el score (retrocompatible).
   */
  academyLevel?: number;
}

export interface ScoredDriver extends DriverCandidate {
  score: number;
}

/**
 * Pesos v1. La EQUIDAD domina (repartir el trabajo), luego proximidad, luego
 * rating como desempate. Ajustables sin tocar la lógica.
 */
export const SCORING_WEIGHTS = { equity: 10, proximity: 2, rating: 1, academy: 1.5 };

/**
 * Rankea a los candidatos de mejor a peor. Si hay candidatos "disponibles" solo
 * puntúa esos; si NINGUNO está disponible, puntúa todos igual (para que el
 * llamador decida — ej. reintentar más tarde en vez de quedarse sin conductor).
 */
export function scoreDrivers(
  candidates: DriverCandidate[],
  weights = SCORING_WEIGHTS,
): ScoredDriver[] {
  if (candidates.length === 0) return [];
  const availables = candidates.filter((c) => c.available);
  const pool = availables.length > 0 ? availables : candidates;

  // Normalizadores (evita división por cero).
  const maxTrips = Math.max(1, ...pool.map((c) => c.tripsToday));
  const dists = pool.map((c) => c.distanceKm).filter((d): d is number => d != null);
  const maxDist = Math.max(1, ...dists);

  return pool
    .map((c) => {
      const equity = 1 - c.tripsToday / maxTrips; // menos viajes → cerca de 1
      const proximity =
        c.distanceKm == null ? 0.5 : 1 - Math.min(1, c.distanceKm / maxDist);
      const ratingNorm = Math.max(0, Math.min(1, c.rating / 5));
      // Academia: 0=sin nivel … 3=Oro. Normalizado a 0–1. Un conductor mejor
      // capacitado sube posiciones ("más nivel = más reservas"). Peso moderado:
      // desempata por debajo de equidad/proximidad, nunca las domina.
      const academyNorm = Math.max(0, Math.min(1, (c.academyLevel ?? 0) / 3));
      const academyW = (weights as any).academy ?? 0;
      const score =
        equity * weights.equity +
        proximity * weights.proximity +
        ratingNorm * weights.rating +
        academyNorm * academyW;
      return { ...c, score: Math.round(score * 1000) / 1000 };
    })
    .sort((a, b) => b.score - a.score);
}

/** Devuelve el mejor conductor (o null si no hay candidatos). */
export function pickBestDriver(
  candidates: DriverCandidate[],
  weights = SCORING_WEIGHTS,
): ScoredDriver | null {
  return scoreDrivers(candidates, weights)[0] ?? null;
}
