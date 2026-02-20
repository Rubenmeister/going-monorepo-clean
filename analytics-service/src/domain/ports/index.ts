/**
 * Ride Analytics Repository Interface
 */
export interface IRideAnalyticsRepository {
  create(analytics: any): Promise<any>;
  findByDate(date: Date): Promise<any>;
  findByDateRange(startDate: Date, endDate: Date): Promise<any[]>;
  update(date: Date, updates: any): Promise<any>;
  delete(date: Date): Promise<void>;
  findLatest(days?: number): Promise<any[]>;
}

/**
 * Driver Analytics Repository Interface
 */
export interface IDriverAnalyticsRepository {
  create(analytics: any): Promise<any>;
  findByDriverAndPeriod(
    driverId: string,
    period: string,
    date: Date
  ): Promise<any>;
  findByDriver(driverId: string, limit?: number): Promise<any[]>;
  update(
    driverId: string,
    period: string,
    date: Date,
    updates: any
  ): Promise<any>;
  delete(driverId: string, period: string, date: Date): Promise<void>;
  findTopDrivers(period: string, limit?: number): Promise<any[]>;
  findDriversByMetric(
    metric: string,
    sortOrder: 'asc' | 'desc',
    limit?: number
  ): Promise<any[]>;
  findLatestByDriver(driverId: string, days?: number): Promise<any[]>;
  findMonthlyStats(
    driverId: string,
    year: number,
    month: number
  ): Promise<any[]>;
}
