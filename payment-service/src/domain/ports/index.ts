/**
 * Payment Repository Interface
 */
export interface IPaymentRepository {
  create(payment: any): Promise<any>;
  findById(id: string): Promise<any>;
  findByTrip(tripId: string): Promise<any>;
  findByPassenger(passengerId: string, limit?: number): Promise<any[]>;
  findByDriver(driverId: string, limit?: number): Promise<any[]>;
  findByStatus(status: string, limit?: number): Promise<any[]>;
  update(id: string, updates: any): Promise<any>;
  delete(id: string): Promise<void>;
  findByDateRange(startDate: Date, endDate: Date): Promise<any[]>;
  findCompletedByDateRange(startDate: Date, endDate: Date): Promise<any[]>;
  calculateDriverRevenue(
    driverId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number>;
}

/**
 * Payout Repository Interface
 */
export interface IPayoutRepository {
  create(payout: any): Promise<any>;
  findById(id: string): Promise<any>;
  findByDriver(driverId: string, limit?: number): Promise<any[]>;
  findByStatus(status: string, limit?: number): Promise<any[]>;
  findByDriverAndPeriod(
    driverId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<any>;
  update(id: string, updates: any): Promise<any>;
  delete(id: string): Promise<void>;
  findPendingPayouts(): Promise<any[]>;
  calculateDriverBalance(driverId: string, upTo?: Date): Promise<number>;
  findDuePayouts(daysThreshold?: number): Promise<any[]>;
}
