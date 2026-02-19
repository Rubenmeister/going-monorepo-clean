import { TrackingSession } from '../entities';

/**
 * TrackingSession Repository Interface
 * Defines operations for persisting and retrieving tracking sessions
 */
export interface ITrackingSessionRepository {
  /**
   * Create a new tracking session
   */
  create(session: TrackingSession): Promise<TrackingSession>;

  /**
   * Get a tracking session by ID
   */
  findById(id: string): Promise<TrackingSession | null>;

  /**
   * Get active tracking session for a trip
   */
  findByTripId(tripId: string): Promise<TrackingSession | null>;

  /**
   * Get all active tracking sessions for a driver
   */
  findActiveByDriverId(driverId: string): Promise<TrackingSession[]>;

  /**
   * Get all tracking sessions for a user
   */
  findByUserId(userId: string, limit?: number): Promise<TrackingSession[]>;

  /**
   * Update a tracking session
   */
  update(id: string, session: Partial<TrackingSession>): Promise<TrackingSession>;

  /**
   * Complete a tracking session
   */
  complete(id: string, endLocation: any): Promise<TrackingSession>;

  /**
   * Delete a tracking session
   */
  delete(id: string): Promise<void>;

  /**
   * Get tracking sessions within a date range
   */
  findByDateRange(
    startDate: Date,
    endDate: Date,
    driverId?: string
  ): Promise<TrackingSession[]>;
}
