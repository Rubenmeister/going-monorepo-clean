/**
 * Hook for ride service operations
 */

import { useCallback } from 'react';
import { useRideStore } from '@/stores/rideStore';
import { rideService } from '@/services/ride';
import type { Ride, Location, VehicleType, ServiceTier } from '@/types';

/** Decode user ID from JWT stored in localStorage */
function getUserIdFromToken(): string {
  try {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('authToken') || localStorage.getItem('auth_token')
        : null;
    if (!token) return 'guest';
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub || payload.id || payload.userId || 'guest';
  } catch {
    return 'guest';
  }
}

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
    rideType?:    VehicleType,
    serviceTier?: ServiceTier,
    passengers?:  number,
    scheduledAt?: string
  ) => Promise<void>;
  cancelRide:   () => Promise<void>;
  clearLocations: () => void;
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
          pickup:     pickupLocation,
          dropoff:    dropoffLocation,
          rideType,
          serviceTier,
          passengers,
          passengerId,
          scheduledAt,
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
