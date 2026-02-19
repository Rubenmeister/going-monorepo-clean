import { DriverAvailability } from '../entities';

/**
 * DriverAvailability Repository Interface
 * Defines operations for managing driver availability status
 */
export interface IDriverAvailabilityRepository {
  /**
   * Save or update a driver's availability status
   */
  upsert(availability: DriverAvailability): Promise<DriverAvailability>;

  /**
   * Get a driver's current availability
   */
  findByDriverId(driverId: string): Promise<DriverAvailability | null>;

  /**
   * Get all available drivers
   */
  findAvailable(limit?: number): Promise<DriverAvailability[]>;

  /**
   * Get all online drivers
   */
  findOnline(limit?: number): Promise<DriverAvailability[]>;

  /**
   * Get all offline drivers
   */
  findOffline(limit?: number): Promise<DriverAvailability[]>;

  /**
   * Get drivers by service type
   */
  findByServiceType(serviceType: string): Promise<DriverAvailability[]>;

  /**
   * Set driver status to offline
   */
  setOffline(driverId: string): Promise<void>;

  /**
   * Set driver status to online
   */
  setOnline(driverId: string): Promise<void>;

  /**
   * Set driver status to busy
   */
  setBusy(driverId: string): Promise<void>;

  /**
   * Delete driver availability (driver logs out)
   */
  delete(driverId: string): Promise<void>;

  /**
   * Get all driver availability records
   */
  findAll(): Promise<DriverAvailability[]>;
}
