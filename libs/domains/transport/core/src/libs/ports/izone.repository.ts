import { Result } from 'neverthrow';
import { Zone, ZoneKind } from '../entities/zone.entity';
import { UUID } from '@going-monorepo-clean/shared-domain';

export const IZoneRepository = Symbol('IZoneRepository');

export interface IZoneRepository {
  save(zone: Zone): Promise<Result<void, Error>>;
  update(zone: Zone): Promise<Result<void, Error>>;
  delete(id: UUID): Promise<Result<void, Error>>;

  findById(id: UUID): Promise<Result<Zone | null, Error>>;
  findAll(opts?: {
    kind?: ZoneKind;
    active?: boolean;
  }): Promise<Result<Zone[], Error>>;

  /**
   * Zonas que contienen el punto `[lng, lat]` — sin filtrar por kind.
   * El caller decide qué hacer con cada kind (service_area, no_service...).
   * Útil para:
   *   - Validar que pickup/dropoff estén en service_area
   *   - Aplicar surchargePct si hay priority
   *   - Bloquear por no_service/restricted
   */
  findContainingPoint(lng: number, lat: number): Promise<Result<Zone[], Error>>;
}
