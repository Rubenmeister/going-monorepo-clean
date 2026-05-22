import axios from 'axios';
import { authService } from './authService';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  'https://api.goingec.com';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request (reads from SecureStore)
api.interceptors.request.use(async (config) => {
  const token = await authService.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401: attempt one token refresh, then retry. On second 401 → clear session.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as typeof error.config & { _retry?: boolean };
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshed = await authService.refresh();
      if (refreshed) {
        original.headers.Authorization = `Bearer ${refreshed.accessToken}`;
        return api(original);
      }
      // Refresh failed — session is gone; let callers (store) react to the 401
    }
    return Promise.reject(error);
  }
);

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  register: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone: string;
  }) => api.post('/auth/register', { ...data, roles: ['user'] }),

  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout').catch(() => {}), // fire-and-forget; clears server-side blacklist
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  updateProfile: (data: { firstName: string; lastName: string; phone?: string }) =>
    api.patch('/auth/me', data),
};

// ── Transport ────────────────────────────────────────────────────────────────
export const transportAPI = {
  /**
   * Crear viaje. Migrado del legacy POST /transport/request al sistema
   * unificado POST /rides/request, que dispara MatchAvailableDriversUseCase
   * (matching geográfico real) y RideEventsGateway (eventos WebSocket) —
   * sin estos, el pasajero quedaba en spinner eterno aunque hubiera
   * conductor.
   *
   * Mantiene la firma de input antigua (origin/destination con address+lat+lng)
   * para no tocar los call sites; internamente mapea al RequestRideDto plano.
   * Response: RideResponseDto con `rideId` (HomeScreen ya tiene fallback a
   * `data?.id ?? data?.rideId`).
   */
  requestRide: (data: {
    userId: string;
    origin: { latitude: number; longitude: number; address: string };
    destination: { latitude: number; longitude: number; address: string };
    price: { amount: number; currency: 'USD' };
    vehicleType?: string;
    tripMode?: string;
    category?: string;
    originCity?: string;
  }) =>
    api.post('/rides/request', {
      pickupLatitude:   data.origin.latitude,
      pickupLongitude:  data.origin.longitude,
      dropoffLatitude:  data.destination.latitude,
      dropoffLongitude: data.destination.longitude,
      // serviceType formato `<vehicleType>_<category>` igual que web
      serviceType: data.vehicleType && data.category
        ? `${data.vehicleType}_${data.category}`
        : (data.vehicleType ?? 'standard'),
    }),

  /** Cancelar viaje activo */
  cancelRide: (rideId: string, reason?: string) =>
    api.put(`/rides/${rideId}/cancel`, reason ? { reason } : {}),

  /** Get pending rides (Sistema B) — usado por driver-app polling */
  getPendingRides: () => api.get('/rides/pending'),

  /** User trip history */
  getUserHistory: (userId: string) =>
    api.get(`/transport/user/${userId}/history`),

  /**
   * Activar SOS / emergencia para un viaje activo.
   * POST /rides/:rideId/sos — backend logea, emite WS a admins, y siempre
   * retorna 201 (no falla aunque side-effects internos fallen, porque la
   * pantalla SOS ya mostró confirmación al pasajero).
   */
  sosAlert: (
    rideId: string,
    data: { currentLat?: number; currentLng?: number; message?: string },
  ) => api.post(`/rides/${rideId}/sos`, data),
};

// ── Bookings ─────────────────────────────────────────────────────────────────
export const bookingsAPI = {
  getAll: () => api.get('/bookings/me'),
  getByUser: (userId: string) => api.get(`/bookings/user/${userId}`),
  getById: (id: string) => api.get(`/bookings/${id}`),
};

// ── Catalog search ────────────────────────────────────────────────────────────
export const searchAPI = {
  tours: (params?: { city?: string; category?: string; maxPrice?: number }) =>
    api.get('/tours/search', { params }),

  accommodations: (params?: {
    city?: string;
    country?: string;
    capacity?: number;
  }) => api.get('/accommodations/search', { params }),

  experiences: (params?: { city?: string; maxPrice?: number }) =>
    api.get('/experiences/search', { params }),
};

// ── Parcels / Envíos ─────────────────────────────────────────────────────────
// Backend DTO (libs/domains/parcel/.../create-parcel.dto.ts):
//   { origin: Location, destination: Location, description, price: { amount, currency } }
// Alternativa flat: { from, to, fromLatitude, fromLongitude, toLatitude, toLongitude }
// Respuesta: { id, trackingCode, otpPin }
export const parcelsAPI = {
  /**
   * Crear nuevo envío con esquema de pago.
   * Combinaciones soportadas (paymentMethod x payerRole):
   *  card+sender    → A: pre-pay con Datafast (response trae paymentUrl)
   *  cash+sender    → B: driver cobra al sender en pickup
   *  card+recipient → C: SMS con link al receptor (paga antes de delivery)
   *  cash+recipient → D: contra entrega
   */
  create: (data: {
    origin: { address: string; latitude?: number; longitude?: number };
    destination: { address: string; latitude?: number; longitude?: number };
    description: string;
    price: { amount: number; currency: 'USD' };
    /** Tamaño → el backend lo usa para cotizar; el precio se recomputa server-side. */
    packageSize?: 'small' | 'medium' | 'large';
    paymentMethod?: 'card' | 'cash';
    payerRole?: 'sender' | 'recipient';
    recipientPhone?: string;
    recipientName?: string;
  }) => api.post<{
    id: string;
    trackingCode: string;
    otpPin: string;
    paymentMethod?: 'card' | 'cash';
    payerRole?: 'sender' | 'recipient';
    paymentStatus?: string;
    status?: string;
    paymentIntentId?: string;
    paymentUrl?: string;  // presente si response es escenario A
  }>('/parcels', data),

  /** Cotización autoritativa (mismo precio que se cobrará). Público, sin auth. */
  quote: (data: {
    origin: { lat: number; lng: number };
    destination: { lat: number; lng: number };
    packageSize?: 'small' | 'medium' | 'large';
    weightKg?: number;
    isOverVolume?: boolean;
  }) =>
    api.post<{
      price: number;
      currency: string;
      isIntercity: boolean;
      routeClass: string;
      originCity: string | null;
      destinationCity: string | null;
    }>('/parcels/quote', data),

  /** Mis envíos */
  getMine: () => api.get('/parcels/my'),

  /** Detalle de un envío */
  getById: (id: string) => api.get(`/parcels/${id}`),

  /** Tracking público por código */
  trackByCode: (trackingCode: string) =>
    api.get(`/parcels/track/${trackingCode}`),

  /** Cancelar envío */
  cancel: (id: string) => api.patch(`/parcels/${id}/cancel`),
};

// ── Rides history ─────────────────────────────────────────────────────────────
export const ridesAPI = {
  /** Historial de viajes del usuario autenticado */
  getUserHistory: (limit = 20) =>
    api.get('/transport/rides/history/user', { params: { limit } }),

  /** Detalle de un viaje por ID */
  getById: (rideId: string) =>
    api.get(`/transport/rides/${rideId}`),

  /** Calificar conductor — el gateway rutea /rides/rate a transport-service.
   *  Antes era /ratings/submit → 404 silente, ratings nunca se enviaban. */
  submitRating: (data: {
    tripId:      string;
    rateeId:     string;
    stars:       number;
    review?:     string;
    categories?: string[];
  }) => api.post('/rides/rate', data),

  /** Estimar precio */
  estimate: (data: {
    serviceType:    string;
    distanceKm?:    number;
    durationMinutes?: number;
  }) => api.post('/payments/estimate', data),

  /** Horarios de viaje compartido disponibles */
  getSharedSchedules: (params: {
    origin:       string;
    destination?: string;
    date?:        string;
  }) => api.get('/transport/shared/schedules', { params }),
};

// ── Payments ─────────────────────────────────────────────────────────────────
export const paymentAPI = {
  createPaymentIntent: (data: {
    amount: number;
    currency: string;
    provider: 'mercadopago' | 'stripe';
    referenceId?: string;
  }) => api.post('/payments/intent', data),

  getPaymentStatus: (paymentId: string) =>
    api.get(`/payments/${paymentId}/status`),
};
