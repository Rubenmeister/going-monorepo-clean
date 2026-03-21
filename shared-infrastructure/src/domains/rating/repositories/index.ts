/**
 * Rating Repositories
 */
export interface IRatingRepository {
  create(rating: any): Promise<any>;
  findById(id: string): Promise<any>;
  findByTrip(tripId: string): Promise<any>;
  findByRatee(rateeId: string, limit?: number): Promise<any[]>;
  findByRater(raterId: string, limit?: number): Promise<any[]>;
  delete(id: string): Promise<void>;
}

export interface IDriverProfileRepository {
  create(profile: any): Promise<any>;
  findByDriver(driverId: string): Promise<any>;
  update(driverId: string, updates: any): Promise<any>;
  delete(driverId: string): Promise<void>;
}
