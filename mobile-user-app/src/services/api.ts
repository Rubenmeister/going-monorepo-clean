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

// ── Direcciones guardadas (Casa/Trabajo/favoritos) ───────────────────────────
/** Shape del backend (/auth/me/saved-addresses) — fuente única, sincroniza web↔móvil. */
export interface SavedAddressDTO {
  id: string;
  type: 'home' | 'work' | 'favorite';
  label: string;
  address: string;
  latitude: number;
  longitude: number;
}

export const savedAddressesAPI = {
  get: () => api.get<{ savedAddresses: SavedAddressDTO[] }>('/auth/me/saved-addresses'),
  put: (savedAddresses: SavedAddressDTO[]) =>
    api.put<{ savedAddresses: SavedAddressDTO[] }>('/auth/me/saved-addresses', { savedAddresses }),
};

// ── Transport ────────────────────────────────────────────────────────────────

/** Punto geográfico (origen / destino) — shape canónico del backend SearchQueryDto. */
export interface GeoPoint {
  lat: number;
  lng: number;
  address?: string;
}

/** Body del POST /search. Espejo del SearchQueryDto del transport-service. */
export interface SearchRideQuery {
  pickup: GeoPoint;
  destination: GeoPoint;
  /** 'immediate' (default) busca viajes ya / 'scheduled' busca cupos compartidos para un horario futuro. */
  temporalPreference?: 'immediate' | 'scheduled';
  /** ISO 8601 — obligatorio si temporalPreference='scheduled'. */
  scheduledDateTime?: string;
  /** Hint de vehículo para cotización interurbano privado. */
  vehicleType?: 'suv' | 'suv_xl' | 'van' | 'van_xl' | 'minibus' | 'bus';
}

export interface SearchRouteInfo {
  routeClass: 'urban_within_city' | 'intercity_corridor' | 'airport_corridor' | string;
  isIntercity: boolean;
  isAirportCorridor: boolean;
  originCity: string | null;
  originLabel: string | null;
  destinationCity: string | null;
  destinationLabel: string | null;
  distanceKm: number;
  estimatedDurationMinutes: number;
  inCoverage: boolean;
}

export interface OnDemandOption {
  serviceType: 'urban_ride' | 'intercity_private_immediate' | 'airport_transfer';
  label: string;
  description: string;
  price: number;
  currency: string;
  estimatedEtaMinutes: number;
  vehicleType?: string;
  breakdown?: Record<string, number>;
}

export interface ScheduledOption {
  scheduledTripId: string;
  driverId: string;
  corridorId: string;
  routeLabel: string;
  /** city IDs normalizados (claves FARES). Necesarios para reserve. */
  originCity: string;
  destCity: string;
  departureTime: string;
  availableSeats: number;
  pricePerSeat: number;
  vehicleModel?: string;
  driver?: { name?: string; rating?: number };
}

export interface AlternativeSchedule extends ScheduledOption {
  recommendationReason: 'same_day_different_time' | 'adjacent_day';
}

export interface SearchRideResponse {
  searchId: string;
  route: SearchRouteInfo;
  temporalPreference: 'immediate' | 'scheduled';
  onDemandOptions: OnDemandOption[];
  scheduledOptions?: ScheduledOption[];
  alternativeSchedules?: AlternativeSchedule[];
  notices: string[];
}

export const transportAPI = {
  /**
   * Buscador unificado de viajes (POST /search en transport-service).
   *
   * Resuelve automáticamente urbano / interurbano / corredor aeropuerto a
   * partir de coords, y devuelve OPCIONES de ride-hailing (onDemand) +
   * carpooling (scheduled) en una sola respuesta. El segment corporate/+25%
   * se deriva del JWT del backend — no es input del cliente (audit #29).
   *
   * Si scheduledOptions viene vacío pero alternativeSchedules tiene, la UI
   * debe mostrar el fallback "no hay cupo en tu horario exacto pero sí en
   * estos cercanos".
   *
   * Usar para nuevo flujo unificado (BookingOptionsScreen). El requestRide
   * legacy queda mientras tanto para compatibilidad.
   */
  searchUnified: (query: SearchRideQuery) =>
    api.post<SearchRideResponse>('/search', query),

  /**
   * Reserva un asiento en un ScheduledTrip (carpooling). Backend valida
   * cupos atómicamente; si OK retorna {bookingId, seatsReserved, perSeatPrice,
   * totalPrice}. Si no hay cupo, 409 Conflict.
   *
   * Llamado desde ConfirmRideScreen cuando type='compartido' + tripId set,
   * ANTES de createPaymentIntent. Si esto falla, no creamos payment.
   */
  reserveScheduledTrip: (
    tripId: string,
    body: {
      originCity: string;
      destCity: string;
      seats: number;
      isGroup?: boolean;
      wantsFrontExclusive?: boolean;
    },
  ) => api.post(`/scheduled-trips/${tripId}/reserve`, body),

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
      // Default 'confort' (rename brand 2026-05-23 desde 'standard').
      serviceType: data.vehicleType && data.category
        ? `${data.vehicleType}_${data.category}`
        : (data.vehicleType ?? 'confort'),
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
   * @deprecated Usar emergencyAPI.createSos() — el endpoint nuevo POST /sos
   * en emergency-service tiene más capacidades (emergencyType, GPS accuracy,
   * emergencyDialerTriggered tracking, persistencia en collection 'incidents'
   * + notificación a ops Telegram con priority RED). Este endpoint legacy se
   * mantiene en caso de necesitar fallback, pero NO debería seguir en uso.
   */
  sosAlert: (
    rideId: string,
    data: { currentLat?: number; currentLng?: number; message?: string },
  ) => api.post(`/rides/${rideId}/sos`, data),
};

// ── Emergency Service ──────────────────────────────────────────────────────
/**
 * Cliente del emergency-service nuevo (Cloud Run service desplegado
 * 2026-05-23). POST /sos via api-gateway → emergency-service /sos.
 *
 * Backend persiste el incident en MongoDB collection 'incidents' y dispara
 * fire-and-forget la notificación a los operadores via Telegram con
 * priority RED + ubicación nativa + link Google Maps.
 *
 * SLA backend: <300ms (Mongo síncrono, Telegram async).
 */
export const emergencyAPI = {
  /**
   * Crear alerta SOS. Backend valida JWT + matchea body.userId === jwt.sub
   * para evitar impersonation.
   *
   * Response: 201 { id, status:'open', priority:'RED', createdAt,
   *                 shouldDial911: boolean }
   *
   * shouldDial911=true es un hint: si el channel es mobile y el cliente
   * aún no llamó al 911 explícitamente, recomendar la llamada.
   */
  createSos: (data: {
    userId:        string;
    channel:       'mobile' | 'web' | 'whatsapp' | 'telegram' | 'voice' | 'api';
    emergencyType?: 'medical' | 'accident' | 'robbery' | 'harassment' | 'vehicle_breakdown' | 'other';
    description?:  string;
    location:      { lat: number; lng: number };
    accuracyM?:    number;
    rideId?:       string;
    emergencyDialerTriggered?: boolean;
  }) => api.post('/sos', data),
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
    /** Envío DISTRIBUIDO: varios puntos de entrega. Cada uno con su destinatario. */
    drops?: Array<{
      address: { address: string; latitude?: number; longitude?: number };
      recipientName?: string;
      recipientPhone?: string;
      description?: string;
    }>;
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
    /** Nº de puntos de entrega (+$5 por dirección extra en un envío distribuido). */
    dropCount?: number;
  }) =>
    api.post<{
      price: number;
      basePrice?: number;
      dropSurcharge?: number;
      dropCount?: number;
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
// Going opera con Datafast (tarjeta) y DeUna (QR/Pichincha) — ver
// createEcuadorIntent. Stripe y MercadoPago se eliminaron del backend (no operan
// en Ecuador), por eso ya no existe el viejo createPaymentIntent(provider).
export const paymentAPI = {
  getPaymentStatus: (paymentId: string) =>
    api.get(`/payments/${paymentId}/status`),

  /**
   * Crear intent de pago digital Ecuador (Datafast tarjeta / DeUna QR).
   *
   * Backend (payment-service /payments/ec/intent) rutea al gateway
   * correspondiente, crea el intent en OPPWA (Datafast) o en la API DeUna,
   * y devuelve el clientSecret + URL para abrir en WebBrowser / mostrar QR.
   *
   * Flow mobile típico:
   *   1. const { checkoutUrl, paymentLink } = await paymentAPI.createEcuadorIntent({ method: 'datafast', amount: 13.50, metadata: { tripId } })
   *   2. Datafast → Linking.openURL(checkoutUrl) → user paga en navegador
   *      DeUna    → mostrar QR del paymentLink + opción "abrir app DeUna"
   *   3. Webhook backend confirma → status payment cambia a 'completed'
   *   4. Mobile pollea getPaymentStatus o recibe push notif
   *
   * Errores:
   *   503 ServiceUnavailable → gateway no configurado (env vars faltan).
   *                            Mobile debe fallback a efectivo.
   *   400 BadRequest         → method inválido o amount < 0.50.
   */
  createEcuadorIntent: (data: {
    method:    'datafast' | 'deuna';
    amount:    number;
    currency?: string;            // default 'USD'
    metadata?: Record<string, unknown>;
  }) => api.post<{
    method:          'datafast' | 'deuna';
    paymentIntentId: string;
    clientSecret:    string;
    checkoutUrl?:    string;   // present si method='datafast'
    paymentLink?:    string;   // present si method='deuna'
  }>('/payments/ec/intent', data),
};
