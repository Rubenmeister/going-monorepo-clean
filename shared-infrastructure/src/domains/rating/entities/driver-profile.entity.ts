/**
 * Driver Profile Entity
 * Aggregated rating and statistics for a driver
 */
export class DriverProfile {
  driverId: string;

  averageRating: number;
  totalRatings: number;
  completedTrips: number;
  cancelledTrips: number;

  acceptanceRate: number; // percentage
  cancellationRate: number; // percentage
  onTimeDeliveryRate: number; // percentage

  totalEarnings: number;
  averageRatingPerTrip: number;

  lastRated?: Date;
  badges: string[] = []; // 'super_driver', 'highly_rated', etc.

  constructor(props: {
    driverId: string;
    averageRating?: number;
    totalRatings?: number;
    completedTrips?: number;
    cancelledTrips?: number;
    acceptanceRate?: number;
    cancellationRate?: number;
    onTimeDeliveryRate?: number;
    totalEarnings?: number;
    lastRated?: Date;
    badges?: string[];
  }) {
    this.driverId = props.driverId;
    this.averageRating = props.averageRating || 5.0;
    this.totalRatings = props.totalRatings || 0;
    this.completedTrips = props.completedTrips || 0;
    this.cancelledTrips = props.cancelledTrips || 0;
    this.acceptanceRate = props.acceptanceRate || 100;
    this.cancellationRate = props.cancellationRate || 0;
    this.onTimeDeliveryRate = props.onTimeDeliveryRate || 100;
    this.totalEarnings = props.totalEarnings || 0;
    this.averageRatingPerTrip = this.totalEarnings / Math.max(this.completedTrips, 1);
    this.lastRated = props.lastRated;
    this.badges = props.badges || [];
  }

  /**
   * Check if driver qualifies for super driver badge
   */
  isSuperDriver(): boolean {
    return (
      this.averageRating >= 4.8 &&
      this.completedTrips >= 100 &&
      this.cancellationRate <= 2
    );
  }

  updateBadges(): void {
    this.badges = [];
    if (this.isSuperDriver()) {
      this.badges.push('super_driver');
    }
    if (this.averageRating >= 4.7) {
      this.badges.push('highly_rated');
    }
    if (this.completedTrips >= 500) {
      this.badges.push('veteran_driver');
    }
  }

  toObject() {
    return {
      driverId: this.driverId,
      averageRating: this.averageRating,
      totalRatings: this.totalRatings,
      completedTrips: this.completedTrips,
      cancelledTrips: this.cancelledTrips,
      acceptanceRate: this.acceptanceRate,
      cancellationRate: this.cancellationRate,
      onTimeDeliveryRate: this.onTimeDeliveryRate,
      totalEarnings: this.totalEarnings,
      averageRatingPerTrip: this.averageRatingPerTrip,
      badges: this.badges,
    };
  }
}
