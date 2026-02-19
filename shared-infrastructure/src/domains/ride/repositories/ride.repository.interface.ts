import { Ride } from '../entities';

/**
 * Ride Repository Interface
 */
export interface IRideRepository {
  /**
   * Create a new ride
   */
  create(ride: Ride): Promise<Ride>;

  /**
   * Get ride by ID
   */
  findById(id: string): Promise<Ride | null>;

  /**
   * Get rides for a user
   */
  findByUserId(userId: string, limit?: number): Promise<Ride[]>;

  /**
   * Get rides for a driver
   */
  findByDriverId(driverId: string, limit?: number): Promise<Ride[]>;

  /**
   * Get active rides for a driver
   */
  findActiveByDriverId(driverId: string): Promise<Ride[]>;

  /**
   * Update a ride
   */
  update(id: string, ride: Partial<Ride>): Promise<Ride>;

  /**
   * Get recent rides (for matching algorithm)
   */
  findRecent(limit: number): Promise<Ride[]>;

  /**
   * Get rides by status
   */
  findByStatus(status: string, limit?: number): Promise<Ride[]>;

  /**
   * Delete a ride
   */
  delete(id: string): Promise<void>;
}
