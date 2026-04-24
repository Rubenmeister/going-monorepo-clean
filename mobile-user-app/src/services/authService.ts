/**
 * authService — single source of truth for token storage on mobile.
 *
 * Storage split:
 *   expo-secure-store → access token, refresh token   (encrypted on-device)
 *   AsyncStorage      → user profile, token expiry    (non-sensitive metadata)
 *
 * Key features:
 *   • Refresh-token deduplication: concurrent 401s share one in-flight refresh
 *   • 60-second proactive refresh window (avoid mid-flight expiry)
 *   • bootstrap() for app startup — restores session or clears stale data
 */

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// ── Storage keys ──────────────────────────────────────────────────────────────

const KEYS = {
  ACCESS:  'auth_access_token',   // SecureStore
  REFRESH: 'auth_refresh_token',  // SecureStore
  EXPIRY:  'auth_token_expiry',   // AsyncStorage (epoch ms as string)
  USER:    'auth_user',           // AsyncStorage (JSON)
} as const;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface StoredUser {
  id:         string;
  firstName:  string;
  lastName:   string;
  email:      string;
  phone:      string;
  roles:      string[];
  avatar?:    string;
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
    return SecureStore.getItemAsync(KEYS.ACCESS);
  },

  async getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync(KEYS.REFRESH);
  },

  async getUser(): Promise<StoredUser | null> {
    const raw = await AsyncStorage.getItem(KEYS.USER);
    if (!raw) return null;
    try { return JSON.parse(raw) as StoredUser; } catch { return null; }
  },

  // ── Write ─────────────────────────────────────────────────────────────────

  async saveTokens({ accessToken, refreshToken, expiresIn }: AuthTokens): Promise<void> {
    // Compute expiry: prefer expiresIn, fall back to JWT claim
    const expiry =
      expiresIn != null
        ? Date.now() + expiresIn * 1000
        : jwtExpiry(accessToken);

    await Promise.all([
      SecureStore.setItemAsync(KEYS.ACCESS, accessToken),
      SecureStore.setItemAsync(KEYS.REFRESH, refreshToken),
      expiry != null
        ? AsyncStorage.setItem(KEYS.EXPIRY, String(expiry))
        : AsyncStorage.removeItem(KEYS.EXPIRY),
    ]);
  },

  async saveUser(user: StoredUser): Promise<void> {
    await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
  },

  // ── Clear ─────────────────────────────────────────────────────────────────

  async clearAll(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(KEYS.ACCESS),
      SecureStore.deleteItemAsync(KEYS.REFRESH),
      AsyncStorage.multiRemove([KEYS.EXPIRY, KEYS.USER]),
    ]);
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
          `${apiUrl}/api/auth/refresh`,
          { refreshToken },
          { timeout: 10_000 },
        );

        const tokens: AuthTokens = {
          accessToken:  data.accessToken,
          refreshToken: data.refreshToken ?? refreshToken, // server may reuse same refresh token
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
   *
   * Flow:
   *   1. Load access token from SecureStore
   *   2. If missing → no session
   *   3. If near expiry → proactive refresh
   *   4. Return valid token (or null on refresh failure)
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
