/**
 * Ride service -- connects to transport-service via API gateway.
 * Falls back to local calculation when backend is unavailable.
 */

import type { Ride, Location, VehicleType, ServiceTier } from '@/types';
import { VEHICLE_TYPES } from '@/types';
import {
  calculateDistance,
  calculateEstimatedDuration,
  calculateFare,
} from './fareCalculator';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('authToken') || localStorage.getItem('auth_token');
}

function authHeaders(): HeadersInit {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface CreateRideRequest {
  pickup:        Location;
  dropoff:       Location;
  rideType:      VehicleType;
  serviceTier:   ServiceTier;
  passengers:    number;
  passengerId:   string;
  scheduledAt?:  string;
  transportMode: 'privado' | 'compartido';
}

class RideService {

  /** Request a new ride */
  async createRide(req: CreateRideRequest): Promise<Ride> {
    const distance      = calculateDistance(req.pickup, req.dropoff);
    const duration      = calculateEstimatedDuration(req.pickup, req.dropoff);
    const vehicle       = VEHICLE_TYPES[req.rideType];
    const tierMult      = req.serviceTier === 'premium' ? vehicle.multiplierPremium : vehicle.multiplierConfort;
    const baseFare      = calculateFare(req.pickup, req.dropoff, req.rideType);
    const estimatedFare = Math.round((baseFare / vehicle.multiplierConfort) * tierMult * 100) / 100;

    if (getAuthToken()) {
      try {
        const response = await fetch(`${API_URL}/rides/request`, {
          method:  'POST',
          headers: authHeaders(),
          body: JSON.stringify({
            pickupLatitude:   req.pickup.lat,
            pickupLongitude:  req.pickup.lon,
            dropoffLatitude:  req.dropoff.lat,
            dropoffLongitude: req.dropoff.lon,
            serviceType:      `${req.rideType}_${req.serviceTier}`,
            passengers:       req.passengers,
            scheduledAt:      req.scheduledAt,
            mode:             req.transportMode === 'compartido' ? 'shared' : 'private',
          }),
        });

        if (response.ok) {
          const data = await response.json();
          return {
            tripId:        data.rideId || data.tripId || `trip-${Date.now()}`,
            passengerId:   req.passengerId,
            pickup:        req.pickup,
            dropoff:       req.dropoff,
            estimatedFare: data.fare?.estimatedTotal ?? estimatedFare,
            distance,
            duration,
            status:        data.status || 'pending',
            createdAt:     new Date(data.requestedAt || Date.now()),
            passengers:    req.passengers,
            vehicleType:   req.rideType,
            transportMode: req.transportMode,
          } as Ride;
        }
      } catch {
        // fall through to local fallback
      }
    }

    return {
      tripId:        `trip-${Date.now()}`,
      passengerId:   req.passengerId,
      pickup:        req.pickup,
      dropoff:       req.dropoff,
      estimatedFare,
      distance,
      duration,
      status:        'pending',
      createdAt:     new Date(),
      passengers:    req.passengers,
      vehicleType:   req.rideType,
      transportMode: req.transportMode,
    } as Ride;
  }

  /** Cancel an active ride */
  async cancelRide(rideId: string): Promise<void> {
    if (!getAuthToken()) return;
    await fetch(`${API_URL}/rides/${rideId}/cancel`, {
      method:  'POST',
      headers: authHeaders(),
    });
  }

  /** Get Twilio proxy number for ride communication */
  async getProxyNumber(rideId: string): Promise<{ proxyNumber: string; masked: boolean }> {
    const res = await fetch(`${API_URL}/rides/${rideId}/proxy-number`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Número de contacto no disponible');
    return res.json();
  }

  /** Get Agora call token for in-app voice */
  async getCallToken(rideId: string): Promise<{ token: string; channel: string; enabled: boolean }> {
    const res = await fetch(`${API_URL}/rides/${rideId}/call-token`, { headers: authHeaders() });
    if (!res.ok) return { token: '', channel: rideId, enabled: false };
    return res.json();
  }
}

export const rideService = new RideService();
