import { Result } from 'neverthrow';
import { Location } from '@going-monorepo-clean/shared-domain';

export interface LocationData {
  driverId: string;
  location: Location;
}

export const IDriverLocationRepository = Symbol('IDriverLocationRepository');

export interface IDriverLocationRepository {
  /**
   * Envía la ubicación actual del conductor al API Gateway.
   */
  sendLocation(data: LocationData, token: string): Promise<Result<void, Error>>;
}