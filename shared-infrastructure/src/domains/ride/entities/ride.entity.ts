import { Coordinates, GeoLocation } from '../../geolocation';
import { Fare, Money } from '../value-objects';
import { RideStatus, CancellationReason } from './ride-status.enum';

/**
 * Ride Entity
 * Represents a ride request and its lifecycle
 */
export class Ride {
  id: string;
  userId: string;
  driverId?: string;

  pickupLocation: GeoLocation;
  dropoffLocation: Coordinates;

  fare: Fare;
  finalFare?: Money;

  status: RideStatus;

  requestedAt: Date;
  acceptedAt?: Date;
  arrivedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;

  durationSeconds?: number;
  distanceKm?: number;

  cancellationReason?: CancellationReason;
  cancellationTime?: Date;

  constructor(props: {
    id: string;
    userId: string;
    pickupLocation: GeoLocation;
    dropoffLocation: Coordinates;
    fare: Fare;
    status?: RideStatus;
    requestedAt?: Date;
    driverId?: string;
    acceptedAt?: Date;
    startedAt?: Date;
    completedAt?: Date;
    finalFare?: Money;
    durationSeconds?: number;
    distanceKm?: number;
    cancellationReason?: CancellationReason;
  }) {
    this.id = props.id;
    this.userId = props.userId;
    this.driverId = props.driverId;
    this.pickupLocation = props.pickupLocation;
    this.dropoffLocation = props.dropoffLocation;
    this.fare = props.fare;
    this.finalFare = props.finalFare;
    this.status = props.status || RideStatus.REQUESTED;
    this.requestedAt = props.requestedAt || new Date();
    this.acceptedAt = props.acceptedAt;
    this.startedAt = props.startedAt;
    this.completedAt = props.completedAt;
    this.durationSeconds = props.durationSeconds;
    this.distanceKm = props.distanceKm;
    this.cancellationReason = props.cancellationReason;
  }

  /**
   * Accept a ride as a driver
   */
  accept(driverId: string): void {
    if (this.status !== RideStatus.REQUESTED) {
      throw new Error(`Can only accept rides in REQUESTED status`);
    }
    this.driverId = driverId;
    this.status = RideStatus.ACCEPTED;
    this.acceptedAt = new Date();
  }

  /**
   * Start a ride
   */
  start(currentLocation: GeoLocation): void {
    if (this.status !== RideStatus.ACCEPTED && this.status !== RideStatus.ARRIVING) {
      throw new Error(`Can only start rides in ACCEPTED or ARRIVING status`);
    }
    this.status = RideStatus.STARTED;
    this.startedAt = new Date();
    this.pickupLocation = currentLocation;
  }

  /**
   * Complete a ride
   */
  complete(
    endLocation: GeoLocation,
    actualDistanceKm: number,
    actualDurationSeconds: number
  ): void {
    if (this.status !== RideStatus.STARTED) {
      throw new Error(`Can only complete rides in STARTED status`);
    }

    this.status = RideStatus.COMPLETED;
    this.completedAt = new Date();
    this.distanceKm = actualDistanceKm;
    this.durationSeconds = actualDurationSeconds;

    // Calculate final fare
    const durationMinutes = actualDurationSeconds / 60;
    this.finalFare = this.fare.calculateFinal(actualDistanceKm, durationMinutes);
  }

  /**
   * Cancel a ride
   */
  cancel(reason: CancellationReason): void {
    if (this.status === RideStatus.COMPLETED) {
      throw new Error(`Cannot cancel completed rides`);
    }

    this.status = RideStatus.CANCELLED;
    this.cancellationReason = reason;
    this.cancellationTime = new Date();
  }

  /**
   * Mark driver as arriving
   */
  markArriving(): void {
    if (this.status !== RideStatus.ACCEPTED) {
      throw new Error(`Can only mark arriving from ACCEPTED status`);
    }
    this.status = RideStatus.ARRIVING;
    this.arrivedAt = new Date();
  }

  /**
   * Get estimated time remaining (in seconds)
   */
  getEstimatedTimeRemaining(): number | null {
    if (!this.startedAt) return null;

    const estimatedDuration = this.fare.estimatedTotal.amount * 1.2; // 20% buffer
    const elapsedSeconds =
      (new Date().getTime() - this.startedAt.getTime()) / 1000;
    const remainingSeconds = estimatedDuration * 60 - elapsedSeconds;

    return Math.max(0, remainingSeconds);
  }

  /**
   * Check if ride is active
   */
  isActive(): boolean {
    return (
      this.status === RideStatus.REQUESTED ||
      this.status === RideStatus.ACCEPTED ||
      this.status === RideStatus.ARRIVING ||
      this.status === RideStatus.STARTED
    );
  }

  toObject() {
    return {
      id: this.id,
      userId: this.userId,
      driverId: this.driverId,
      pickupLocation: this.pickupLocation.toObject(),
      dropoffLocation: this.dropoffLocation.toObject(),
      fare: this.fare.toObject(),
      finalFare: this.finalFare?.toJSON(),
      status: this.status,
      requestedAt: this.requestedAt,
      acceptedAt: this.acceptedAt,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
      durationSeconds: this.durationSeconds,
      distanceKm: this.distanceKm,
      cancellationReason: this.cancellationReason,
    };
  }
}
