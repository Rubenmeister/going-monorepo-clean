import { Result } from 'neverthrow';
import { DriverLocation } from '../entities/driver-location.entity';

export const I_DRIVER_LOCATION_GATEWAY = Symbol('IDriverLocationGateway');

export interface IDriverLocationGateway {
  broadcastLocation(location: DriverLocation): Promise<Result<void, Error>>;
}

