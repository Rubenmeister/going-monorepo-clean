import { Result } from 'neverthrow';
import { DriverBase } from '../entities/driver-base.entity';
import { UUID } from '@going-monorepo-clean/shared-domain';

export const IDriverBaseRepository = Symbol('IDriverBaseRepository');

export interface DriverBaseWithDistance {
  base: DriverBase;
  /** Distancia en km entre la base y el punto consultado. */
  distanceKm: number;
}

export interface IDriverBaseRepository {
  save(base: DriverBase): Promise<Result<void, Error>>;
  update(base: DriverBase): Promise<Result<void, Error>>;
  delete(id: UUID): Promise<Result<void, Error>>;

  findById(id: UUID): Promise<Result<DriverBase | null, Error>>;
  findByDriverId(driverId: UUID): Promise<Result<DriverBase[], Error>>;
  findPrimaryByDriverId(driverId: UUID): Promise<Result<DriverBase | null, Error>>;

  /**
   * Devuelve drivers cuya base activa esté ≤ maxKm del punto, ordenado
   * por distancia ascendente. Filtra `active=true` y opcionalmente
   * por shift actual (driver dentro de su horario).
   *
   * Útil para PRIORIZAR conductores en MatchAvailableDrivers — si N
   * drivers tienen base cerca, se ofrecen primero antes del Redis
   * GEORADIUS general por GPS actual.
   */
  findBasesNearPoint(
    lat: number,
    lng: number,
    opts?: {
      maxKm?: number;          // default 10
      maxResults?: number;     // default 20
      onlyInShift?: boolean;   // default false
      now?: Date;              // para isInShift
    },
  ): Promise<Result<DriverBaseWithDistance[], Error>>;
}
