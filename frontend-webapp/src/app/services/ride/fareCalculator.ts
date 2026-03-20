/**
 * Fare calculation logic for rides
 */

import type { Location, RideType } from '@/types';

const BASE_FARE = 2.5;
const COST_PER_KM = 0.5;
const COST_PER_MINUTE = 0.1;
const MINUTES_PER_KM = 2.5;
const PEAK_HOUR_MULTIPLIER = 1.5;
const PEAK_HOURS = { start: 8, end: 9, eveningStart: 17, eveningEnd: 19 };

const RIDE_TYPE_MULTIPLIERS: Record<RideType, number> = {
  economy: 1,
  comfort: 1.3,
  premium: 1.6,
};

/**
 * Calculate distance between two coordinates in kilometers
 */
export function calculateDistance(pickup: Location, dropoff: Location): number {
  // Haversine formula — accurate for all distances on Earth
  const R = 6371; // Earth radius in km
  const dLat = ((dropoff.lat - pickup.lat) * Math.PI) / 180;
  const dLon = ((dropoff.lon - pickup.lon) * Math.PI) / 180;
  const lat1 = (pickup.lat * Math.PI) / 180;
  const lat2 = (dropoff.lat * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Check if current time is peak hour
 */
export function isPeakHour(): boolean {
  const hour = new Date().getHours();
  const isMorningPeak = hour >= PEAK_HOURS.start && hour <= PEAK_HOURS.end;
  const isEveningPeak =
    hour >= PEAK_HOURS.eveningStart && hour <= PEAK_HOURS.eveningEnd;
  return isMorningPeak || isEveningPeak;
}

/**
 * Calculate fare based on pickup and dropoff locations
 */
export function calculateFare(
  pickup: Location,
  dropoff: Location,
  rideType: RideType = 'economy'
): number {
  const distance = calculateDistance(pickup, dropoff);
  const estimatedMinutes = distance * MINUTES_PER_KM;

  let fare = BASE_FARE;
  fare += distance * COST_PER_KM;
  fare += estimatedMinutes * COST_PER_MINUTE;

  // Apply ride type multiplier
  const rideTypeMultiplier = RIDE_TYPE_MULTIPLIERS[rideType];
  fare *= rideTypeMultiplier;

  // Apply peak hour surge pricing
  if (isPeakHour()) {
    fare *= PEAK_HOUR_MULTIPLIER;
  }

  // Round to 2 decimal places
  return Math.round(fare * 100) / 100;
}

/**
 * Calculate estimated duration in minutes
 */
export function calculateEstimatedDuration(
  pickup: Location,
  dropoff: Location
): number {
  const distance = calculateDistance(pickup, dropoff);
  return Math.round(distance * MINUTES_PER_KM);
}

/**
 * Get fare breakdown for display
 */
export interface FareBreakdown {
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  rideTypeMultiplier: number;
  surgeMultiplier: number;
  totalFare: number;
}

export function getFareBreakdown(
  pickup: Location,
  dropoff: Location,
  rideType: RideType = 'economy'
): FareBreakdown {
  const distance = calculateDistance(pickup, dropoff);
  const estimatedMinutes = distance * MINUTES_PER_KM;

  const baseFare = BASE_FARE;
  const distanceFare = distance * COST_PER_KM;
  const timeFare = estimatedMinutes * COST_PER_MINUTE;
  const rideTypeMultiplier = RIDE_TYPE_MULTIPLIERS[rideType];
  const surgeMultiplier = isPeakHour() ? PEAK_HOUR_MULTIPLIER : 1;

  const subtotal = baseFare + distanceFare + timeFare;
  const totalFare =
    Math.round(subtotal * rideTypeMultiplier * surgeMultiplier * 100) / 100;

  return {
    baseFare,
    distanceFare,
    timeFare,
    rideTypeMultiplier,
    surgeMultiplier,
    totalFare,
  };
}
