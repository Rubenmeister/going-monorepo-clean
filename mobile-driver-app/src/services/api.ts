import axios from 'axios';
import { authService } from './authService';

/**
 * Driver app axios instance — centraliza auth via interceptors.
 *
 * Migración: las pantallas legacy hacen `AsyncStorage.getItem('driver_token')`
 * y arman headers manualmente. Esto sigue funcionando porque guardamos el
 * access en la misma key, pero conviene migrarlas a `import { api } from
 * '../../services/api'` y usar `api.get/post/...` directo. El interceptor:
 *
 *   - Request: agrega Authorization header desde authService
 *   - Response 401: intenta refresh, reintenta la request original una vez
 *
 * Sin esto, cuando TTL = 15m el conductor vería errores 401 random sin que
 * la sesión sea realmente inválida.
 */

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  'https://api.goingec.com';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await authService.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 401 → un refresh → reintentar request original.
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
      // Refresh falló — sesión muerta. Las pantallas reaccionan al 401
      // del segundo intento (o el store detecta token null).
    }
    return Promise.reject(error);
  },
);

// ── Driver Hybrid Mode ────────────────────────────────────────────────
//
// Endpoints del transport-service para que el conductor combine viajes
// interurbanos con carreras locales en la ciudad destino sin riesgo de
// llegar tarde al retorno (45 min buffer obligatorio).
//
// Ver docs del backend en transport-service/src/api/driver-hybrid.controller.ts

export type DriverHybridState =
  | 'IDLE'
  | 'LONG_TRIP_OUTBOUND'
  | 'AVAILABLE_LOCAL'
  | 'BLOCKED_REST'
  | 'LONG_TRIP_RETURN';

export interface DriverHybridStateResponse {
  state: DriverHybridState;
  active: boolean;
  destinationCity?: string | null;
  nextLongTripStartTime?: string | null;
  restWindowStartsAt?: string | null;
  restBufferMinutes?: number;
  minutesUntilRestWindow?: number | null;
  acceptingLocalRides?: boolean;
}

export interface StartLocalModeInput {
  destinationCity: string;
  destLat: number;
  destLng: number;
  outboundScheduledTripId: string;
  returnScheduledTripId: string;
  nextLongTripStartTime: string; // ISO 8601
  localRadiusKm?: number;
  restBufferMinutes?: number;
}

export const driverHybridAPI = {
  /** Estado actual del modo híbrido del conductor (poll cada ~30s). */
  getMyState: () => api.get<DriverHybridStateResponse>('/driver-hybrid/me'),

  /** Driver llegó al destino del intercity y quiere modo local activo. */
  startLocalMode: (input: StartLocalModeInput) =>
    api.post<DriverHybridStateResponse>('/driver-hybrid/start-local-mode', input),

  /** Driver completó el retorno → IDLE. */
  completeReturn: () =>
    api.post<DriverHybridStateResponse>('/driver-hybrid/complete-return'),

  /** Opt-out o cancelación del retorno. */
  cancel: () => api.post<DriverHybridStateResponse>('/driver-hybrid/cancel'),
};
