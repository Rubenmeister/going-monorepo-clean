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
  rejectTrip: (tripId: string, reason?: string) => Promise<void>;
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
      if (!token) throw new Error('No se recibió token de autenticación');
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

  /**
   * Poll GET /rides/pending for new ride requests (Sistema B unificado).
   * Sustituye el polling viejo a /transport/pending; los viajes pedidos
   * desde web (que ahora usa /rides/request) y desde mobile-user-app
   * (también migrada) viven en RideRepository, no en TripRepository.
   * El backend devuelve el mismo shape PendingTrip — sin cambio en
   * call sites.
   */
  pollPendingTrips: async () => {
    if (!get().isOnline) return;
    try {
      const { data } = await api.get('/rides/pending');
      const trips: PendingTrip[] = Array.isArray(data) ? data : [];
      set({ pendingTrip: trips.length > 0 ? trips[0] : null });
    } catch {
      /* network error — keep last state */
    }
  },

  /**
   * PUT /rides/:rideId/accept con info completa del conductor.
   * El RideController la propaga al pasajero vía notifyDriverAccepted
   * para que vea nombre/vehículo/placa/rating en su panel de tracking.
   */
  acceptTrip: async (tripId: string) => {
    const { driver } = get();
    if (!driver) return;
    try {
      await api.put(`/rides/${tripId}/accept`, {
        driverId:     driver.id,
        driverName:   `${driver.firstName ?? ''} ${driver.lastName ?? ''}`.trim() || 'Conductor',
        vehiclePlate: driver.vehiclePlate ?? '',
        driverRating: driver.rating ?? 5.0,
      });
      set({ currentRideId: tripId, pendingTrip: null });
    } catch (e: any) {
      set({ error: e.response?.data?.message || 'Error al aceptar viaje' });
    }
  },

  /**
   * POST /rides/:tripId/reject — Conductor declina la oferta. El backend
   * añade el driverId a `rejectedByDriverIds` para que GET /rides/pending
   * NO devuelva este viaje en futuros polls (evita flood al mismo conductor).
   * Idempotente — llamadas repetidas son no-op en el backend.
   */
  rejectTrip: async (tripId: string, reason?: string) => {
    try {
      await api.post(`/rides/${tripId}/reject`, reason ? { reason } : {});
    } catch (e: any) {
      // No bloqueamos UX si la red falla — limpiamos local de todos modos.
      // El próximo poll puede traer el viaje de nuevo si el rechazo no se grabó,
      // pero el conductor verá la oferta una vez más en lugar de quedar atado.
      console.warn('rejectTrip API failed:', e?.response?.data?.message ?? e?.message);
    } finally {
      // Limpieza local: cualquiera sea el resultado, el conductor descartó la oferta.
      set({ pendingTrip: null });
    }
  },

  clearError: () => set({ error: null }),
}));
