/**
 * Fare calculation logic for rides
 */

import type { Location, RideType } from '@/types';
import { RIDE_TYPES } from '@/types';

const BASE_FARE       = 2.5;
const COST_PER_KM     = 0.50;
const COST_PER_MINUTE = 0.10;
const MINUTES_PER_KM  = 2.5;
const PEAK_HOUR_MULTIPLIER = 1.5;
const PEAK_HOURS = { start: 8, end: 9, eveningStart: 17, eveningEnd: 19 };

/** Check if current time is peak hour */
export function isPeakHour(): boolean {
  const hour = new Date().getHours();
  return (hour >= PEAK_HOURS.start && hour <= PEAK_HOURS.end) ||
         (hour >= PEAK_HOURS.eveningStart && hour <= PEAK_HOURS.eveningEnd);
}

/** Haversine distance in km */
export function calculateDistance(pickup: Location, dropoff: Location): number {
  const R = 6371;
  const dLat = ((dropoff.lat - pickup.lat) * Math.PI) / 180;
  const dLon = ((dropoff.lon - pickup.lon) * Math.PI) / 180;
  const lat1 = (pickup.lat * Math.PI) / 180;
  const lat2 = (dropoff.lat * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Estimated duration in minutes */
export function calculateEstimatedDuration(pickup: Location, dropoff: Location): number {
  return Math.round(calculateDistance(pickup, dropoff) * MINUTES_PER_KM);
}

/** Total fare estimate */
export function calculateFare(
  pickup: Location,
  dropoff: Location,
  rideType: RideType = 'suv'
): number {
  const distance = calculateDistance(pickup, dropoff);
  const minutes  = distance * MINUTES_PER_KM;
  const vehicle  = RIDE_TYPES[rideType];
  const surge    = isPeakHour() ? PEAK_HOUR_MULTIPLIER : 1;

  const fare =
    (BASE_FARE + distance * COST_PER_KM + minutes * COST_PER_MINUTE) *
    vehicle.multiplier *
    surge;

  return Math.round(fare * 100) / 100;
}

export interface FareBreakdown {
  baseFare:            number;
  distanceFare:        number;
  timeFare:            number;
  vehicleMultiplier:   number;
  surgeMultiplier:     number;
  totalFare:           number;
  distanceKm:          number;
  durationMin:         number;
}

export function getFareBreakdown(
  pickup: Location,
  dropoff: Location,
  rideType: RideType = 'suv'
): FareBreakdown {
  const distance  = calculateDistance(pickup, dropoff);
  const minutes   = distance * MINUTES_PER_KM;
  const vehicle   = RIDE_TYPES[rideType];
  const surge     = isPeakHour() ? PEAK_HOUR_MULTIPLIER : 1;

  const baseFare      = BASE_FARE;
  const distanceFare  = distance * COST_PER_KM;
  const timeFare      = minutes * COST_PER_MINUTE;
  const totalFare     = Math.round((baseFare + distanceFare + timeFare) * vehicle.multiplier * surge * 100) / 100;

  return {
    baseFare,
    distanceFare,
    timeFare,
    vehicleMultiplier: vehicle.multiplier,
    surgeMultiplier:   surge,
    totalFare,
    distanceKm:        Math.round(distance * 10) / 10,
    durationMin:       Math.round(minutes),
  };
}
