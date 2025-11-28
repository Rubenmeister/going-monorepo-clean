import { DriverLocation } from '../entities/driver-location.entity';
import { DriverId } from '../entities/driver.entity';

export interface IDriverLocationRepository {
  save(location: DriverLocation): Promise<void>;
  findLastLocationByDriverId(driverId: DriverId): Promise<DriverLocation | null>;
  findActiveDriversByTripId(tripId: string): Promise<DriverLocation[]>;
}