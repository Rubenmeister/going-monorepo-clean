import { create } from 'zustand';

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
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: Date;
  completedAt?: Date;
  driverLocation?: Location;
  driverInfo?: {
    name: string;
    rating: number;
    photo: string;
    vehicle: string;
    licensePlate: string;
  };
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
  updateFinalFare: (tripId: string, fare: number) => void;
  addToHistory: (ride: Ride) => void;
  clearRide: () => void;
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
    set((state) => ({
      activeRide: state.activeRide
        ? { ...state.activeRide, status }
        : null,
    })),

  updateDriverLocation: (location: Location) =>
    set((state) => ({
      activeRide: state.activeRide
        ? {
            ...state.activeRide,
            driverLocation: location,
          }
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

  setLoading: (loading: boolean) =>
    set({ loading }),

  setError: (error: string | null) =>
    set({ error }),
}));
