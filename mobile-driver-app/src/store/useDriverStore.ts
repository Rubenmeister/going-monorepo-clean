import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';
import { authService } from '../services/authService';

/**
 * Normaliza el shape del driver que llega del backend.
 * Acepta variantes (camelCase, snake_case, id/userId, .user envoltorio o raw).
 * Returns null si no hay forma de extraer un id válido o si el rol no incluye 'driver'.
 */
function normalizeDriver(raw: any): Driver | null {
  if (!raw) return null;
  const u = raw.user ?? raw;
  const id = u?.id ?? u?.userId ?? u?._id ?? u?.user_id;
  if (!id) return null;
  const roles: string[] = Array.isArray(u.roles) ? u.roles : [];
  if (!roles.includes('driver')) return null;
  return {
    id:           String(id),
    firstName:    u.firstName ?? u.first_name ?? '',
    lastName:     u.lastName  ?? u.last_name  ?? '',
    email:        u.email     ?? '',
    vehiclePlate: u.vehiclePlate ?? u.vehicle_plate,
    rating:       u.rating,
    isOnline:     u.isOnline ?? u.is_online,
  };
}

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
    set({ isLoading: true });
    try {
      // bootstrap maneja refresh proactivo si el access está cerca de exp.
      const token = await authService.bootstrap();
      if (!token) {
        set({ token: null, driver: null, isLoading: false });
        return;
      }
      const stored = await authService.getDriver();
      if (stored) {
        set({ token, driver: stored as Driver, isLoading: false });
        return;
      }
      // Token vivo, sin driver guardado → re-hidratar desde /auth/me.
      try {
        const { data } = await api.get('/auth/me');
        const driver = normalizeDriver(data);
        if (!driver) {
          // /auth/me respondió pero el shape no es un driver válido.
          await authService.clearAll();
          set({ token: null, driver: null, isLoading: false });
          return;
        }
        await authService.saveDriver(driver);
        set({ token, driver, isLoading: false });
      } catch {
        // Error transient (red): NO destruir tokens, solo dejar sin sesión UI
        // hasta el próximo arranque.
        set({ token: null, driver: null, isLoading: false });
      }
    } catch {
      set({ token: null, driver: null, isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      // A3: backend devuelve { accessToken, refreshToken, expiresIn, user, ... }.
      // Compat con backends viejos que solo devolvían `token` o `access_token`.
      const accessToken: string = data.accessToken ?? data.token ?? data.access_token;
      const refreshToken: string | undefined = data.refreshToken;
      const expiresIn: number | undefined = data.expiresIn;
      if (!accessToken) throw new Error('No se recibió token de autenticación');

      await authService.saveTokens({
        accessToken,
        refreshToken: refreshToken ?? '',
        expiresIn,
      });

      // Normalizar el driver (acepta data.user o data raw). Si no aparece o
      // su shape está incompleto, re-pedirlo a /auth/me con el token nuevo.
      let driver = normalizeDriver(data.user) ?? normalizeDriver(data);
      if (!driver) {
        try {
          const me = await api.get('/auth/me');
          driver = normalizeDriver(me.data);
        } catch {
          driver = null;
        }
      }
      if (!driver) {
        // Token guardado quedaría huérfano — limpiamos para que el próximo
        // intento sea limpio y mostramos error útil.
        await authService.clearAll();
        set({
          error: 'Esta cuenta no tiene acceso a la app de conductores.',
          isLoading: false,
        });
        return;
      }

      await authService.saveDriver(driver);
      set({ token: accessToken, driver, isLoading: false });
    } catch (e: any) {
      set({
        error: e.response?.data?.message || 'Error al iniciar sesión',
        isLoading: false,
      });
    }
  },

  logout: async () => {
    // Server-side revoke del refresh token (A3). Si falla por red,
    // limpiamos local de todos modos — la sesión está rota igual.
    try {
      const rt = await authService.getRefreshToken();
      await api.post('/auth/logout', rt ? { refreshToken: rt } : {});
    } catch {
      /* best-effort */
    }
    await authService.clearAll();
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
