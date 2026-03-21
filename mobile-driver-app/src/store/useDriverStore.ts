import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_BASE =
  process.env.EXPO_PUBLIC_API_URL ||
  'https://api.goingec.com';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('driver_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export interface PendingTrip {
  id: string;
  userId: string;
  origin: { address: string; latitude: number; longitude: number };
  destination: { address: string; latitude: number; longitude: number };
  price: { amount: number; currency: string };
  status: string;
}

interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  vehiclePlate?: string;
  rating?: number;
  isOnline?: boolean;
}

interface DriverState {
  token: string | null;
  driver: Driver | null;
  isOnline: boolean;
  currentRideId: string | null;
  pendingTrip: PendingTrip | null;
  earnings: { today: number; week: number; total: number };
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadToken: () => Promise<void>;
  toggleOnline: () => void;
  pollPendingTrips: () => Promise<void>;
  acceptTrip: (tripId: string) => Promise<void>;
  clearError: () => void;
}

export const useDriverStore = create<DriverState>((set, get) => ({
  token: null,
  driver: null,
  isOnline: false,
  currentRideId: null,
  pendingTrip: null,
  earnings: { today: 0, week: 0, total: 0 },
  isLoading: false,
  error: null,

  loadToken: async () => {
    const token = await AsyncStorage.getItem('driver_token');
    const raw   = await AsyncStorage.getItem('driver_user');
    if (token && raw) {
      // Restaurar conductor completo desde storage
      set({ token, driver: JSON.parse(raw) });
    } else if (token) {
      // Sin datos de usuario guardados: limpiar sesión
      await AsyncStorage.removeItem('driver_token');
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      const token = data.token ?? data.access_token;
      const driverData = data.user ?? data;

      // Solo permitir acceso a conductores con rol 'driver'
      const roles: string[] = Array.isArray(driverData.roles) ? driverData.roles : [];
      if (!roles.includes('driver')) {
        set({ error: 'Esta cuenta no tiene acceso a la app de conductores.', isLoading: false });
        return;
      }

      const driver: Driver = {
        id: driverData.id ?? driverData.userId,
        firstName: driverData.firstName ?? '',
        lastName: driverData.lastName ?? '',
        email: driverData.email,
        vehiclePlate: driverData.vehiclePlate,
        rating: driverData.rating,
        isOnline: driverData.isOnline,
      };
      await AsyncStorage.setItem('driver_token', token);
      await AsyncStorage.setItem('driver_user', JSON.stringify(driver));
      set({ token, driver, isLoading: false });
    } catch (e: any) {
      set({
        error: e.response?.data?.message || 'Error al iniciar sesión',
        isLoading: false,
      });
    }
  },

  logout: async () => {
    await AsyncStorage.multiRemove(['driver_token', 'driver_user']);
    set({
      token: null,
      driver: null,
      isOnline: false,
      currentRideId: null,
      pendingTrip: null,
    });
  },

  /** Online/offline toggle — purely local; backend notified best-effort */
  toggleOnline: () => {
    const newStatus = !get().isOnline;
    set({ isOnline: newStatus });
    if (!newStatus) set({ pendingTrip: null });
  },

  /** Poll GET /transport/pending for new trip requests */
  pollPendingTrips: async () => {
    if (!get().isOnline) return;
    try {
      const { data } = await api.get('/transport/pending');
      const trips: PendingTrip[] = Array.isArray(data) ? data : [];
      set({ pendingTrip: trips.length > 0 ? trips[0] : null });
    } catch {
      /* network error — keep last state */
    }
  },

  /** PATCH /transport/:tripId/accept */
  acceptTrip: async (tripId: string) => {
    const { driver } = get();
    if (!driver) return;
    try {
      await api.patch(`/transport/${tripId}/accept`, { driverId: driver.id });
      set({ currentRideId: tripId, pendingTrip: null });
    } catch (e: any) {
      set({ error: e.response?.data?.message || 'Error al aceptar viaje' });
    }
  },

  clearError: () => set({ error: null }),
}));
