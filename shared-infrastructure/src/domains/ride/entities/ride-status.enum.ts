/**
 * Ride Status Enum
 * Represents the lifecycle states of a ride
 */
export enum RideStatus {
  REQUESTED = 'requested',
  ACCEPTED = 'accepted',
  ARRIVING = 'arriving',
  STARTED = 'started',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

/**
 * Cancellation reasons
 */
export enum CancellationReason {
  USER_CANCELLED = 'user_cancelled',
  DRIVER_CANCELLED = 'driver_cancelled',
  NO_DRIVER_ACCEPTED = 'no_driver_accepted',
  DRIVER_NOT_ARRIVED = 'driver_not_arrived',
  EMERGENCY = 'emergency',
  OTHER = 'other',
}
