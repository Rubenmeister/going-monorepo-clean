import { create } from 'zustand';
import type { VehicleType, ServiceTier } from '@/types';

export interface Location {
  address: string;
  lat: number;
  lon: number;
  city?: string;
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
  status: 'reserved' | 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'no_driver';
  createdAt: Date;
  /** Fecha/hora reservada para viajes programados (status='reserved'). */
  scheduledAt?: Date;
  completedAt?: Date;
  driverLocation?: Location;
  driverInfo?: {
    name: string;
    rating: number;
    photo: string;
    vehicle: string;
    licensePlate: string;
  };
  passengers?: number;
  vehicleType?: VehicleType;
  serviceTier?: ServiceTier;
}

interface RideStore {
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
  setEstimatedFare: (fare: number) => void;
  createRide: (ride: Ride) => void;
  setActiveRide: (ride: Ride | null) => void;
  updateRideStatus: (tripId: string, status: Ride['status']) => void;
  updateDriverLocation: (location: Location) => void;
  updateDriverInfo: (tripId: string, driverInfo: NonNullable<Ride['driverInfo']>) => void;
  updateFinalFare: (tripId: string, fare: number) => void;
  addToHistory: (ride: Ride) => void;
  clearRide: () => void;
  resetForRetry: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useRideStore = create<RideStore>((set) => ({
  // Initial state
  activeRide: null,
  rideHistory: [],
  pickupLocation: null,
  dropoffLocation: null,
  estimatedFare: null,
  loading: false,
  error: null,

  // Actions
  setPickupLocation: (location: Location) =>
    set({ pickupLocation: location }),

  setDropoffLocation: (location: Location) =>
    set({ dropoffLocation: location }),

  setEstimatedFare: (fare: number) =>
    set({ estimatedFare: fare }),

  createRide: (ride: Ride) =>
    set({ activeRide: ride, error: null }),

  setActiveRide: (ride: Ride | null) =>
    set({ activeRide: ride }),

  updateRideStatus: (tripId: string, status: Ride['status']) =>
    set((state) => {
      // Solo muta si el evento corresponde al viaje activo: un evento WS rezagado
      // de otro viaje (o de uno ya cerrado) no debe pisar el estado actual (#36).
      if (!state.activeRide || state.activeRide.tripId !== tripId) return state;
      return { activeRide: { ...state.activeRide, status } };
    }),

  updateDriverLocation: (location: Location) =>
    set((state) => ({
      activeRide: state.activeRide
        ? {
            ...state.activeRide,
            driverLocation: location,
          }
        : null,
    })),

  updateDriverInfo: (tripId: string, driverInfo: NonNullable<Ride['driverInfo']>) =>
    set((state) => ({
      activeRide: state.activeRide
        ? { ...state.activeRide, driverInfo }
        : null,
    })),

  updateFinalFare: (tripId: string, fare: number) =>
    set((state) => ({
      activeRide: state.activeRide
        ? { ...state.activeRide, finalFare: fare }
        : null,
    })),

  addToHistory: (ride: Ride) =>
    set((state) => ({
      rideHistory: [ride, ...state.rideHistory],
    })),

  clearRide: () =>
    set({
      activeRide: null,
      pickupLocation: null,
      dropoffLocation: null,
      estimatedFare: null,
    }),

  // Reset suave para "reintentar" tras no_driver: descarta el ride fallido
  // pero conserva pickup/dropoff/estimatedFare en el store para que el form
  // los muestre pre-rellenados al remontar.
  resetForRetry: () =>
    set({ activeRide: null, error: null }),

  setLoading: (loading: boolean) =>
    set({ loading }),

  setError: (error: string | null) =>
    set({ error }),
}));
