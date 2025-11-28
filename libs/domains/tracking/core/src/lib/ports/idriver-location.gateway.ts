import { DriverLocation } from '../entities/driver-location.entity';

export interface IDriverLocationGateway {
  broadcastLocation(location: DriverLocation): Promise<void>;
}