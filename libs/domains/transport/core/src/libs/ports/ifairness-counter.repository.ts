import { Result } from 'neverthrow';
import { UUID } from '@going-monorepo-clean/shared-domain';

export const IFairnessCounterRepository = Symbol('IFairnessCounterRepository');

/**
 * Llave compuesta del contador. Usamos `YYYY-MM-DD` por default; el
 * caller puede pasar un periodKey distinto si quiere periodos
 * diferentes (semanal, por shift de mañana/tarde/noche, etc.).
 */
export interface FairnessKey {
  driverId: UUID;
  baseId?: UUID;     // opcional — si el driver no tiene base, contar global
  periodKey: string; // 'YYYY-MM-DD', 'YYYY-WW', etc.
}

export interface DriverFairnessSnapshot {
  driverId: UUID;
  baseId?: UUID;
  periodKey: string;
  count: number;
}

export interface IFairnessCounterRepository {
  /**
   * Incrementa el counter del driver+base+period en 1 (atomic en Redis).
   * Devuelve el nuevo valor. TTL 7 días por default — los periodos
   * antiguos se limpian automáticamente.
   */
  increment(key: FairnessKey, ttlSec?: number): Promise<Result<number, Error>>;

  /** Consulta el valor actual sin modificar. 0 si no existe. */
  get(key: FairnessKey): Promise<Result<number, Error>>;

  /** Batch: leer counters de varios drivers en una sola call (mget). */
  getMany(keys: FairnessKey[]): Promise<Result<DriverFairnessSnapshot[], Error>>;

  /** Reset (delete) — admin override. */
  reset(key: FairnessKey): Promise<Result<void, Error>>;
}

/**
 * Helper para generar la periodKey por default — día calendario en
 * formato YYYY-MM-DD usando la zona horaria de Ecuador (UTC-5).
 *
 * Para un sistema con shifts mañana/tarde/noche, retornar
 * `YYYY-MM-DD-shift` con shift∈{m|t|n}.
 */
export function defaultPeriodKey(now: Date = new Date()): string {
  // Ajustar a Ecuador (UTC-5) sin asumir TZ del runtime.
  const ec = new Date(now.getTime() - 5 * 60 * 60 * 1000);
  const y = ec.getUTCFullYear();
  const m = String(ec.getUTCMonth() + 1).padStart(2, '0');
  const d = String(ec.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
