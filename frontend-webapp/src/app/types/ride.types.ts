/**
 * Ride and Location types
 */

export interface Location {
  address: string;
  lat: number;
  lon: number;
  city?: string;
}

export type RideStatus =
  | 'pending'
  | 'accepted'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface DriverInfo {
  name: string;
  rating: number;
  photo: string;
  vehicle: string;
  licensePlate: string;
}

export interface Ride {
  tripId: string;
  passengerId: string;
  driverId?: string;
  pickup: Location;
  dropoff: Location;
  estimatedFare: number;
  finalFare?: number;
  distance: number;
  duration: number;
  status: RideStatus;
  createdAt: Date;
  completedAt?: Date;
  driverLocation?: Location;
  driverInfo?: DriverInfo;
}

export type RideType = 'economy' | 'comfort' | 'premium';

export const RIDE_TYPES: Record<
  RideType,
  { label: string; emoji: string; multiplier: number }
> = {
  economy: { label: 'Economy', emoji: '🚗', multiplier: 1 },
  comfort: { label: 'Comfort', emoji: '🚙', multiplier: 1.3 },
  premium: { label: 'Premium', emoji: '🚘', multiplier: 1.6 },
};

export const RIDE_STATUS_LABELS: Record<RideStatus, string> = {
  pending: 'Waiting for driver',
  accepted: 'Driver accepted',
  in_progress: 'On the way',
  completed: 'Completed',
  cancelled: 'Cancelled',
};
