/**
 * Rating Repository Interface
 */
export interface IRatingRepository {
  create(rating: any): Promise<any>;
  findById(id: string): Promise<any>;
  findByTrip(tripId: string): Promise<any>;
  findByRatee(rateeId: string, limit?: number, offset?: number): Promise<any[]>;
  findByRater(raterId: string, limit?: number, offset?: number): Promise<any[]>;
  update(id: string, data: any): Promise<any>;
  delete(id: string): Promise<void>;
  findRecent(limit?: number): Promise<any[]>;
  findByRateeWithStats(rateeId: string): Promise<any>;
}

/**
 * Driver Profile Repository Interface
 */
export interface IDriverProfileRepository {
  findByDriver(driverId: string): Promise<any>;
  updateAggregateStats(driverId: string, stats: any): Promise<any>;
}
