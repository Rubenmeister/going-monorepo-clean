import { UUID } from '@going-monorepo-clean/shared-domain';

export const IDriverComplianceRepository = Symbol('IDriverComplianceRepository');

/**
 * Estado de compliance simplificado para uso en matching engine.
 * Coincide con el `status` de DriverComplianceReport del schema en
 * transport-service, pero se redefine acá para no acoplar libs/transport-core
 * a un schema concreto de un service específico.
 *
 * Caller debe interpretar:
 *   'verified'        → driver elegible para matching
 *   cualquier otro    → driver EXCLUIDO del pool
 */
export type DriverComplianceStatus =
  | 'verified'
  | 'pending'
  | 'expired'
  | 'rejected'
  | 'tourism_pending'
  | 'unknown';

/**
 * Puerto para consultar compliance de drivers desde casos de uso de matching
 * (rides y parcels). La implementación real vive en transport-service
 * (MongoDriverComplianceRepository) que lee driver_documents y computa via
 * computeDriverCompliance.
 *
 * Diseño:
 *   - Batch-friendly: getStatusesForDrivers acepta N drivers, hace UNA query
 *     a Mongo en vez de N (evita N+1 en cada matching).
 *   - Devuelve Map<driverId, status> — caller filtra en memoria.
 *   - Drivers sin docs en absoluto → status 'pending' (les falta todo).
 */
export interface IDriverComplianceRepository {
  /**
   * Devuelve el status de compliance de cada driver en el set.
   *
   * @param driverIds  IDs de drivers a verificar. Si vacío, devuelve Map vacía.
   * @returns          Map<driverId, status>. Drivers sin entrada en la Map
   *                   deben ser tratados como 'unknown' por el caller (degradación gentil).
   */
  getStatusesForDrivers(
    driverIds: UUID[] | string[],
  ): Promise<Map<string, DriverComplianceStatus>>;
}
