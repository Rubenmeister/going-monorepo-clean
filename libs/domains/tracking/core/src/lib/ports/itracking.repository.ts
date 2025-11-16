import { Result } from 'neverthrow';
import { DriverLocation } from '../entities/driver-location.entity';
import { UUID } from '@going-monorepo-clean/shared-domain';

// Symbol para inyección de dependencias
export const ITrackingRepository = Symbol('ITrackingRepository');

export interface ITrackingRepository {
  /** Guarda la ubicación (idealmente en Redis con un TTL) */
  save(location: DriverLocation): Promise<Result<void, Error>>;
  
  findByDriverId(driverId: UUID): Promise<Result<DriverLocation | null, Error>>;
  
  /** Obtiene todas las ubicaciones activas (no expiradas) */
  findAllActive(): Promise<Result<DriverLocation[], Error>>;
}