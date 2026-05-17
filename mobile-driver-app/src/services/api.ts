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
