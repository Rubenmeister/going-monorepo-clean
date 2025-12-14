import { Result } from 'neverthrow';
import { DriverLocation } from '../entities/driver-location.entity';

export const I_DRIVER_LOCATION_REPOSITORY = Symbol('IDriverLocationRepository');

export interface IDriverLocationRepository {
  save(location: DriverLocation): Promise<Result<void, Error>>;
  findByDriverId(driverId: string): Promise<Result<DriverLocation | null, Error>>;
}
