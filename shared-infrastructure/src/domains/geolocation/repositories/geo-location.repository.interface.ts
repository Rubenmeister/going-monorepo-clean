import { GeoLocation } from '../entities';
import { Distance } from '../value-objects';

/**
 * GeoLocation Repository Interface
 * Defines operations for storing and querying geographic locations
 */
export interface IGeoLocationRepository {
  /**
   * Save a driver's current location
   */
  saveLocation(location: GeoLocation): Promise<void>;

  /**
   * Get the latest location of a driver
   */
  getDriverLocation(driverId: string): Promise<GeoLocation | null>;

  /**
   * Find all drivers within a certain radius of a location
   */
  findDriversNearby(
    latitude: number,
    longitude: number,
    radius: Distance,
    limit?: number
  ): Promise<GeoLocation[]>;

  /**
   * Find drivers in multiple locations (batch query)
   */
  findDriversNearbyMultiple(
    locations: Array<{ latitude: number; longitude: number }>,
    radius: Distance
  ): Promise<Map<string, GeoLocation[]>>;

  /**
   * Get the distance between two drivers
   */
  getDistance(driverId1: string, driverId2: string): Promise<Distance | null>;

  /**
   * Delete a driver's location
   */
  deleteLocation(driverId: string): Promise<void>;

  /**
   * Get all active drivers locations
   */
  getAllActiveDrivers(): Promise<GeoLocation[]>;
}
