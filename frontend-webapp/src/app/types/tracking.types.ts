/**
 * Ride tracking and status types
 */

import type { Ride, RideStatus, DriverInfo, Location } from './ride.types';

export interface StatusConfig {
  icon: string;
  label: string;
  color: string;
  textColor: string;
}

export const STATUS_CONFIGS: Record<RideStatus, StatusConfig> = {
  pending: {
    icon: '🔍',
    label: 'Finding driver',
    color: 'bg-red-100',
    textColor: 'text-blue-800',
  },
  accepted: {
    icon: '👤',
    label: 'Driver accepted',
    color: 'bg-purple-100',
    textColor: 'text-purple-800',
  },
  in_progress: {
    icon: '🚗',
    label: 'On the way',
    color: 'bg-orange-100',
    textColor: 'text-orange-800',
  },
  completed: {
    icon: '✅',
    label: 'Ride completed',
    color: 'bg-green-100',
    textColor: 'text-green-800',
  },
  cancelled: {
    icon: '❌',
    label: 'Cancelled',
    color: 'bg-red-100',
    textColor: 'text-red-800',
  },
};

export interface RideTrackingEvent {
  eventType: RideStatus;
  timestamp: Date;
  location?: Location;
  driverInfo?: DriverInfo;
}

export interface RideHistory {
  tripId: string;
  date: Date;
  pickup: Location;
  dropoff: Location;
  fare: number;
  duration: number;
  driverName: string;
  rating?: number;
}
