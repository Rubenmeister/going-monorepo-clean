/**
 * Hook for ride service operations
 */

import { useCallback } from 'react';
import { useRideStore } from '@/stores/rideStore';
import { rideService } from '@/services/ride';
import type { Ride, Location, VehicleType, ServiceTier } from '@/types';
import { getStoredToken, parseJwtPayload } from '@/lib/providers/auth-client';

export interface UseRideServiceReturn {
  activeRide:       Ride | null;
  rideHistory:      Ride[];
  pickupLocation:   Location | null;
  dropoffLocation:  Location | null;
  estimatedFare:    number | null;
  loading:          boolean;
  error:            string | null;

  setPickupLocation:  (location: Location) => void;
  setDropoffLocation: (location: Location) => void;
  createRide:         (
    rideType?:      VehicleType,
    serviceTier?:   ServiceTier,
    passengers?:    number,
    scheduledAt?:   string,
    transportMode?: 'privado' | 'compartido'
  ) => Promise<void>;
  cancelRide:   () => Promise<void>;
  clearLocations: () => void;
}

/** Decode user ID del JWT (a través del helper de auth-client) */
function getUserIdFromToken(): string {
  const token = getStoredToken();
  if (!token) return 'guest';
  const payload = parseJwtPayload<{ sub?: string; id?: string; userId?: string }>(token);
  return payload?.sub || payload?.id || payload?.userId || 'guest';
}

export function useRideService(): UseRideServiceReturn {
  const {
    activeRide,
    rideHistory,
    pickupLocation,
    dropoffLocation,
    estimatedFare,
    loading,
    error,
    setPickupLocation,
    setDropoffLocation,
    createRide:  storeCreateRide,
    setLoading,
    setError,
    clearRide,
  } = useRideStore();

  const createRide = useCallback(
    async (
      rideType: VehicleType = 'suv',
      serviceTier: ServiceTier = 'confort',
      passengers = 1,
      scheduledAt?: string,
      transportMode: 'privado' | 'compartido' = 'privado',
    ) => {
      if (!pickupLocation || !dropoffLocation) {
        setError('Selecciona origen y destino');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const passengerId = getUserIdFromToken();
        const ride = await rideService.createRide({
          pickup:        pickupLocation,
          dropoff:       dropoffLocation,
          rideType,
          serviceTier,
          passengers,
          passengerId,
          scheduledAt,
          transportMode,
        });
        storeCreateRide(ride);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo crear el viaje');
      } finally {
        setLoading(false);
      }
    },
    [pickupLocation, dropoffLocation, storeCreateRide, setLoading, setError]
  );

  const cancelRide = useCallback(async () => {
    if (!activeRide) { setError('No hay viaje activo'); return; }
    setLoading(true);
    setError(null);
    try {
      await rideService.cancelRide(activeRide.tripId);
      clearRide();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cancelar el viaje');
    } finally {
      setLoading(false);
    }
  }, [activeRide, clearRide, setLoading, setError]);

  return {
    activeRide,
    rideHistory,
    pickupLocation,
    dropoffLocation,
    estimatedFare,
    loading,
    error,
    setPickupLocation,
    setDropoffLocation,
    createRide,
    cancelRide,
    clearLocations: clearRide,
  };
}
