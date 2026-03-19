/**
 * Ride Analytics Entity (Phase 7)
 * Aggregated statistics for ride analytics and reporting
 */
export class RideAnalytics {
  date: Date;
  totalRides: number;
  completedRides: number;
  cancelledRides: number;
  totalDistance: number; // in km
  totalDuration: number; // in minutes
  totalRevenue: number;
  platformRevenue: number; // 20% commission
  driverEarnings: number; // 80% to drivers
  averageRideDistance: number;
  averageRideDuration: number;
  averageFare: number;
  peakHourRides: Record<number, number>; // hour -> count
  ridesByStatus: {
    completed: number;
    cancelled: number;
    noShow: number;
  };
  cancellationRateByReason: Record<string, number>;
  topRoutes: Array<{
    from: string;
    to: string;
    count: number;
    averageFare: number;
  }>;

  constructor(props: {
    date: Date;
    totalRides?: number;
    completedRides?: number;
    cancelledRides?: number;
    totalDistance?: number;
    totalDuration?: number;
    totalRevenue?: number;
    platformRevenue?: number;
    driverEarnings?: number;
    peakHourRides?: Record<number, number>;
    ridesByStatus?: any;
    cancellationRateByReason?: Record<string, number>;
    topRoutes?: Array<any>;
  }) {
    this.date = props.date;
    this.totalRides = props.totalRides || 0;
    this.completedRides = props.completedRides || 0;
    this.cancelledRides = props.cancelledRides || 0;
    this.totalDistance = props.totalDistance || 0;
    this.totalDuration = props.totalDuration || 0;
    this.totalRevenue = props.totalRevenue || 0;
    this.platformRevenue = props.platformRevenue || 0;
    this.driverEarnings = props.driverEarnings || 0;
    this.averageRideDistance = this.totalRides > 0 ? this.totalDistance / this.completedRides : 0;
    this.averageRideDuration = this.totalRides > 0 ? this.totalDuration / this.completedRides : 0;
    this.averageFare = this.totalRides > 0 ? this.totalRevenue / this.completedRides : 0;
    this.peakHourRides = props.peakHourRides || {};
    this.ridesByStatus = props.ridesByStatus || { completed: 0, cancelled: 0, noShow: 0 };
    this.cancellationRateByReason = props.cancellationRateByReason || {};
    this.topRoutes = props.topRoutes || [];
  }

  getCompletionRate(): number {
    if (this.totalRides === 0) return 0;
    return Math.round((this.completedRides / this.totalRides) * 100);
  }

  getCancellationRate(): number {
    if (this.totalRides === 0) return 0;
    return Math.round((this.cancelledRides / this.totalRides) * 100);
  }

  toObject() {
    return {
      date: this.date,
      totalRides: this.totalRides,
      completedRides: this.completedRides,
      cancelledRides: this.cancelledRides,
      completionRate: this.getCompletionRate(),
      cancellationRate: this.getCancellationRate(),
      totalDistance: Math.round(this.totalDistance * 100) / 100,
      totalDuration: this.totalDuration,
      totalRevenue: Math.round(this.totalRevenue * 100) / 100,
      platformRevenue: Math.round(this.platformRevenue * 100) / 100,
      driverEarnings: Math.round(this.driverEarnings * 100) / 100,
      averageRideDistance: Math.round(this.averageRideDistance * 100) / 100,
      averageRideDuration: Math.round(this.averageRideDuration * 100) / 100,
      averageFare: Math.round(this.averageFare * 100) / 100,
      peakHourRides: this.peakHourRides,
      ridesByStatus: this.ridesByStatus,
      cancellationRateByReason: this.cancellationRateByReason,
      topRoutes: this.topRoutes,
    };
  }
}
