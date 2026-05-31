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
import { authFetch, getStoredToken } from '@/lib/providers/auth-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export interface CreateRideRequest {
  pickup:        Location;
  dropoff:       Location;
  rideType:      VehicleType;
  serviceTier:   ServiceTier;
  passengers:    number;
  passengerId:   string;
  scheduledAt?:  string;
  transportMode: 'ciudad' | 'privado' | 'compartido';
  /** Precio garantizado fijado al reservar (solo viajes programados). */
  lockedFare?:   number;
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

    if (!getStoredToken()) {
      throw new Error('Necesitas iniciar sesión para solicitar un viaje.');
    }

    let response: Response;
    try {
      response = await authFetch(`${API_URL}/rides/request`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickupLatitude:   req.pickup.lat,
          pickupLongitude:  req.pickup.lon,
          dropoffLatitude:  req.dropoff.lat,
          dropoffLongitude: req.dropoff.lon,
          serviceType:      `${req.rideType}_${req.serviceTier}`,
          passengers:       req.passengers,
          // 'ciudad' es inmediato → nunca mandamos scheduledAt aunque por
          // alguna razón viniera (defensa en profundidad).
          scheduledAt:      req.transportMode === 'ciudad' ? undefined : req.scheduledAt,
          // Backend solo distingue shared/private; 'ciudad' viaja como private.
          mode:             req.transportMode === 'compartido' ? 'shared' : 'private',
          // Precio garantizado para reservas (el backend lo preserva).
          lockedFare:       req.lockedFare,
        }),
      });
    } catch (err) {
      // Error de red real (no de status code)
      console.error('[rideService.createRide] network error:', err);
      throw new Error(
        'No se pudo conectar con el servidor. Verifica tu conexión e intenta de nuevo.'
      );
    }

    if (!response.ok) {
      // Backend rechazó la solicitud — extraer mensaje y propagarlo al UI.
      // ANTES: este código fallback-eaba con un mock local que dejaba al
      // usuario "atrapado" sin saber que el backend no había procesado nada.
      // Ahora propagamos el error para que el form muestre feedback real.
      let serverMsg = `Error ${response.status} al crear el viaje`;
      try {
        const errBody = await response.json();
        if (errBody?.message) serverMsg = errBody.message;
      } catch {
        // body no es JSON, usamos el msg por defecto
      }
      throw new Error(serverMsg);
    }

    const data = await response.json();
    // El backend devuelve status='scheduled' para reservas (viaje a futuro
    // que aún no busca conductor). En el front lo representamos como 'reserved'.
    const status = data.status === 'scheduled' ? 'reserved' : (data.status || 'pending');
    return {
      tripId:        data.rideId || data.tripId || `trip-${Date.now()}`,
      passengerId:   req.passengerId,
      pickup:        req.pickup,
      dropoff:       req.dropoff,
      // En reservas el precio mostrado es el fijado (lockedFare); si no, el estimado.
      estimatedFare: data.lockedFare ?? data.fare?.estimatedTotal ?? estimatedFare,
      distance,
      duration,
      status,
      createdAt:     new Date(data.requestedAt || Date.now()),
      scheduledAt:   req.scheduledAt ? new Date(req.scheduledAt) : undefined,
      passengers:    req.passengers,
      vehicleType:   req.rideType,
      transportMode: req.transportMode,
    } as Ride;
  }

  /** Cancel an active ride */
  async cancelRide(rideId: string): Promise<void> {
    if (!getStoredToken()) return;
    await authFetch(`${API_URL}/rides/${rideId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /** Get ride history for the authenticated user */
  async getRideHistory(limit = 50): Promise<any[]> {
    if (!getStoredToken()) return [];
    try {
      const res = await authFetch(`${API_URL}/rides?limit=${limit}`);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : (data.rides ?? data.data ?? []);
    } catch {
      return [];
    }
  }

  /** Get Twilio proxy number for ride communication */
  async getProxyNumber(rideId: string): Promise<{ proxyNumber: string; masked: boolean }> {
    const res = await authFetch(`${API_URL}/rides/${rideId}/proxy-number`);
    if (!res.ok) throw new Error('Número de contacto no disponible');
    return res.json();
  }

  /** Get Agora call token for in-app voice */
  async getCallToken(rideId: string): Promise<{ token: string; channel: string; enabled: boolean }> {
    const res = await authFetch(`${API_URL}/rides/${rideId}/call-token`);
    if (!res.ok) return { token: '', channel: rideId, enabled: false };
    return res.json();
  }
}

export const rideService = new RideService();
