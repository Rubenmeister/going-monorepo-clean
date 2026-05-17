/**
 * authService — single source of truth for token storage on driver app.
 *
 * Diferencias con mobile-user-app:
 *   - Storage: solo AsyncStorage (sin SecureStore, no estaba en deps).
 *   - Key del access token = 'driver_token' (compat con código legacy
 *     que ya leía esto directo). Las pantallas viejas siguen funcionando
 *     pero deberían migrarse a `authService.getAccessToken()` para que el
 *     access esté siempre fresco (refresh proactivo 60s antes de exp).
 *
 * Estrategia A3:
 *   - Login → backend devuelve accessToken + refreshToken + expiresIn
 *   - saveTokens persiste los 3
 *   - getAccessToken() simple read (interceptor del api.ts hace el refresh)
 *   - 401 en cualquier llamada → axios interceptor llama refresh() → reintenta
 *   - bootstrap() al inicio: si access cerca de expirar, refresca proactivo
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// ── Storage keys ──────────────────────────────────────────────────────────────

const KEYS = {
  ACCESS:  'driver_token',          // legacy name — keep for compat
  REFRESH: 'driver_refresh_token',
  EXPIRY:  'driver_token_expiry',   // epoch ms as string
  USER:    'driver_user',
} as const;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface StoredDriver {
  id:            string;
  firstName:     string;
  lastName:      string;
  email:         string;
  vehiclePlate?: string;
  rating?:       number;
  isOnline?:     boolean;
}

export interface AuthTokens {
  accessToken:  string;
  refreshToken: string;
  expiresIn?:   number; // seconds
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Decode JWT expiry without a library (just reads the payload). */
function jwtExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

const REFRESH_THRESHOLD_MS = 60_000; // refresh 60 s before actual expiry

// ── In-flight deduplication ───────────────────────────────────────────────────

let refreshPromise: Promise<AuthTokens | null> | null = null;

// ── Public API ────────────────────────────────────────────────────────────────

export const authService = {
  // ── Read ──────────────────────────────────────────────────────────────────

  async getAccessToken(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.ACCESS);
  },

  async getRefreshToken(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.REFRESH);
  },

  async getDriver(): Promise<StoredDriver | null> {
    const raw = await AsyncStorage.getItem(KEYS.USER);
    if (!raw) return null;
    try { return JSON.parse(raw) as StoredDriver; } catch { return null; }
  },

  // ── Write ─────────────────────────────────────────────────────────────────

  async saveTokens({ accessToken, refreshToken, expiresIn }: AuthTokens): Promise<void> {
    const expiry =
      expiresIn != null
        ? Date.now() + expiresIn * 1000
        : jwtExpiry(accessToken);

    // Backend puede no devolver refreshToken (ej. OAuth flows) — evitamos
    // sobreescribir el existente con string vacío en ese caso.
    const refreshOp = refreshToken
      ? AsyncStorage.setItem(KEYS.REFRESH, refreshToken)
      : Promise.resolve();

    await Promise.all([
      AsyncStorage.setItem(KEYS.ACCESS, accessToken),
      refreshOp,
      expiry != null
        ? AsyncStorage.setItem(KEYS.EXPIRY, String(expiry))
        : AsyncStorage.removeItem(KEYS.EXPIRY),
    ]);
  },

  async saveDriver(driver: StoredDriver): Promise<void> {
    await AsyncStorage.setItem(KEYS.USER, JSON.stringify(driver));
  },

  // ── Clear ─────────────────────────────────────────────────────────────────

  async clearAll(): Promise<void> {
    await AsyncStorage.multiRemove([KEYS.ACCESS, KEYS.REFRESH, KEYS.EXPIRY, KEYS.USER]);
  },

  // ── Refresh ───────────────────────────────────────────────────────────────

  /**
   * Refresh the access token, deduplicating concurrent calls.
   * Returns the new tokens on success, null on failure.
   */
  async refresh(): Promise<AuthTokens | null> {
    if (refreshPromise) return refreshPromise;

    refreshPromise = (async (): Promise<AuthTokens | null> => {
      try {
        const refreshToken = await this.getRefreshToken();
        if (!refreshToken) return null;

        const apiUrl =
          process.env.EXPO_PUBLIC_API_URL ?? 'https://api.goingec.com';

        const { data } = await axios.post<AuthTokens>(
          `${apiUrl}/auth/refresh`,
          { refreshToken },
          { timeout: 10_000 },
        );

        const tokens: AuthTokens = {
          accessToken:  data.accessToken,
          refreshToken: data.refreshToken ?? refreshToken,
          expiresIn:    data.expiresIn,
        };

        await this.saveTokens(tokens);
        return tokens;
      } catch {
        await this.clearAll();
        return null;
      } finally {
        refreshPromise = null;
      }
    })();

    return refreshPromise;
  },

  /**
   * Check whether the stored access token will expire within the threshold.
   */
  async isNearExpiry(): Promise<boolean> {
    const raw = await AsyncStorage.getItem(KEYS.EXPIRY);
    if (!raw) return false;
    const expiry = Number(raw);
    return Date.now() + REFRESH_THRESHOLD_MS >= expiry;
  },

  // ── Bootstrap ─────────────────────────────────────────────────────────────

  /**
   * Called once at app startup. Returns the access token ready to use,
   * or null if the session could not be restored.
   */
  async bootstrap(): Promise<string | null> {
    const token = await this.getAccessToken();
    if (!token) return null;

    if (await this.isNearExpiry()) {
      const refreshed = await this.refresh();
      return refreshed?.accessToken ?? null;
    }

    return token;
  },
};
