/**
 * Driver Analytics Entity
 * Individual driver performance metrics and statistics
 */
export class DriverAnalytics {
  driverId: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  date: Date;

  // Activity metrics
  ridesCompleted: number;
  ridesCancelled: number;
  hoursOnline: number;
  averageRideDistance: number;
  averageRideDuration: number;

  // Revenue metrics
  totalEarnings: number;
  averageEarningsPerRide: number;
  averageEarningsPerHour: number;

  // Quality metrics
  averageRating: number;
  totalRatings: number;
  acceptanceRate: number; // percentage
  cancellationRate: number; // percentage
  onTimeDeliveryRate: number; // percentage

  // Performance badges
  badges: string[];

  constructor(props: {
    driverId: string;
    period: 'daily' | 'weekly' | 'monthly' | 'yearly';
    date: Date;
    ridesCompleted?: number;
    ridesCancelled?: number;
    hoursOnline?: number;
    averageRideDistance?: number;
    averageRideDuration?: number;
    totalEarnings?: number;
    averageEarningsPerRide?: number;
    averageEarningsPerHour?: number;
    averageRating?: number;
    totalRatings?: number;
    acceptanceRate?: number;
    cancellationRate?: number;
    onTimeDeliveryRate?: number;
    badges?: string[];
  }) {
    this.driverId = props.driverId;
    this.period = props.period;
    this.date = props.date;
    this.ridesCompleted = props.ridesCompleted || 0;
    this.ridesCancelled = props.ridesCancelled || 0;
    this.hoursOnline = props.hoursOnline || 0;
    this.averageRideDistance = props.averageRideDistance || 0;
    this.averageRideDuration = props.averageRideDuration || 0;
    this.totalEarnings = props.totalEarnings || 0;
    this.averageEarningsPerRide =
      props.averageEarningsPerRide || (this.ridesCompleted > 0 ? this.totalEarnings / this.ridesCompleted : 0);
    this.averageEarningsPerHour =
      props.averageEarningsPerHour || (this.hoursOnline > 0 ? this.totalEarnings / this.hoursOnline : 0);
    this.averageRating = props.averageRating || 5.0;
    this.totalRatings = props.totalRatings || 0;
    this.acceptanceRate = props.acceptanceRate || 100;
    this.cancellationRate = props.cancellationRate || 0;
    this.onTimeDeliveryRate = props.onTimeDeliveryRate || 100;
    this.badges = props.badges || [];
  }

  getCompletionRate(): number {
    const total = this.ridesCompleted + this.ridesCancelled;
    if (total === 0) return 0;
    return Math.round((this.ridesCompleted / total) * 100);
  }

  toObject() {
    return {
      driverId: this.driverId,
      period: this.period,
      date: this.date,
      ridesCompleted: this.ridesCompleted,
      ridesCancelled: this.ridesCancelled,
      completionRate: this.getCompletionRate(),
      hoursOnline: Math.round(this.hoursOnline * 100) / 100,
      averageRideDistance: Math.round(this.averageRideDistance * 100) / 100,
      averageRideDuration: Math.round(this.averageRideDuration * 100) / 100,
      totalEarnings: Math.round(this.totalEarnings * 100) / 100,
      averageEarningsPerRide: Math.round(this.averageEarningsPerRide * 100) / 100,
      averageEarningsPerHour: Math.round(this.averageEarningsPerHour * 100) / 100,
      averageRating: Math.round(this.averageRating * 10) / 10,
      totalRatings: this.totalRatings,
      acceptanceRate: this.acceptanceRate,
      cancellationRate: this.cancellationRate,
      onTimeDeliveryRate: this.onTimeDeliveryRate,
      badges: this.badges,
    };
  }
}
