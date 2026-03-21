/**
 * Hook for ride service operations
 */

import { useCallback } from 'react';
import { useRideStore } from '@/stores/rideStore';
import { rideService } from '@/services/ride';
import type { Ride, Location, RideType } from '@/types';

export interface UseRideServiceReturn {
  // State
  activeRide: Ride | null;
  rideHistory: Ride[];
  pickupLocation: Location | null;
  dropoffLocation: Location | null;
  estimatedFare: number | null;
  loading: boolean;
  error: string | null;

  // Actions
  setPickupLocation: (location: Location) => void;
  setDropoffLocation: (location: Location) => void;
  createRide: (rideType: RideType) => Promise<void>;
  cancelRide: () => Promise<void>;
  clearLocations: () => void;
}

/**
 * Hook for managing ride operations
 */
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
    createRide: storeCreateRide,
    setLoading,
    setError,
    clearRide,
  } = useRideStore();

  const createRide = useCallback(
    async (rideType: RideType) => {
      if (!pickupLocation || !dropoffLocation) {
        setError('Please select both pickup and dropoff locations');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const ride = await rideService.createRide({
          pickup: pickupLocation,
          dropoff: dropoffLocation,
          rideType,
          passengerId: 'passenger-001', // TODO: Get from auth store
        });

        storeCreateRide(ride);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to create ride';
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [pickupLocation, dropoffLocation, storeCreateRide, setLoading, setError]
  );

  const cancelRide = useCallback(async () => {
    if (!activeRide) {
      setError('No active ride to cancel');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await rideService.cancelRide(activeRide.tripId);
      clearRide();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to cancel ride';
      setError(message);
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
