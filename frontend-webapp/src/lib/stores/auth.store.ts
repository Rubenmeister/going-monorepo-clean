import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * User profile interface
 */
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  /** Full roles array from JWT — drives role-based UI (admin, driver, corporate, user). */
  roles: string[];
  /** First role — convenience shorthand. Kept for backward compat with older callers. */
  role: 'user' | 'admin' | 'driver' | 'corporate';
  isAdmin: () => boolean;
}

/**
 * Authentication state and actions
 */
export interface AuthState {
  // State
  token: string | null;
  refreshToken: string | null;
  user: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  isHydrated: boolean;

  // Actions
  setAuth: (token: string, refreshToken: string | null, user: UserProfile) => void;
  setToken: (token: string, refreshToken?: string | null) => void;
  setUser: (user: UserProfile) => void;
  setError: (error: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  clearAuth: () => void;
  hydrate: () => void;
  isAuthenticated: () => boolean;
  refreshIfNeeded: () => Promise<boolean>;
}

const initialState = {
  token: null,
  refreshToken: null,
  user: null,
  isLoading: false,
  error: null,
  isHydrated: false,
};

/**
 * Zustand store for authentication state
 * Includes localStorage persistence with SSR-safe hydration
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setAuth: (token: string, refreshToken: string | null, user: UserProfile) => {
        set({ token, refreshToken, user, error: null });
      },

      setToken: (token: string, refreshToken?: string | null) => {
        set((state) => ({
          ...state,
          token,
          refreshToken: refreshToken ?? state.refreshToken,
        }));
      },

      setUser: (user: UserProfile) => {
        set({ user });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      setLoading: (isLoading: boolean) => {
        set({ isLoading });
      },

      clearAuth: () => {
        set(initialState);
      },

      hydrate: () => {
        set({ isHydrated: true });
      },

      isAuthenticated: () => {
        const { token } = get();
        return token !== null && token !== '';
      },

      /**
       * Refresh the access token if it is expired or near expiration.
       * Returns true if the session is now valid, false if refresh failed.
       */
      refreshIfNeeded: async (): Promise<boolean> => {
        const { token, refreshToken } = get();

        if (!refreshToken) return false;

        // Check if token is still valid (not expired within next 60s)
        if (token) {
          try {
            const parts = token.split('.');
            if (parts.length === 3) {
              const payload = JSON.parse(
                typeof window !== 'undefined'
                  ? atob(parts[1])
                  : Buffer.from(parts[1], 'base64').toString('utf-8')
              );
              const expiresAt = payload.exp * 1000;
              if (expiresAt - Date.now() > 60_000) {
                return true; // token still valid for > 60s
              }
            }
          } catch {
            // ignore decode errors — try refresh anyway
          }
        }

        // Token expired or near expiry — attempt refresh.
        // Endpoint: prefer `NEXT_PUBLIC_API_URL`; fall back to same-origin
        // `/auth/refresh` for local dev setups using a Next.js proxy.
        const apiBase =
          (typeof process !== 'undefined' &&
            process.env?.['NEXT_PUBLIC_API_URL']) ||
          '';
        const refreshUrl = apiBase
          ? `${apiBase.replace(/\/$/, '')}/auth/refresh`
          : '/auth/refresh';

        try {
          const res = await fetch(refreshUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
            cache: 'no-store',
          });

          if (!res.ok) {
            set({ ...initialState });
            return false;
          }

          const data = await res.json();
          // Backend devuelve `{ accessToken, token, refreshToken }` — ambos alias.
          const newToken = data.accessToken ?? data.token;
          const newRefresh = data.refreshToken ?? refreshToken;

          if (!newToken) {
            set({ ...initialState });
            return false;
          }

          set({ token: newToken, refreshToken: newRefresh });
          return true;
        } catch {
          set({ ...initialState });
          return false;
        }
      },
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => {
        // Only use localStorage in browser environment
        if (typeof window !== 'undefined') {
          return localStorage;
        }
        // Fallback for SSR
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
      version: 1,
    }
  )
);

/**
 * Hydrate auth store on client side
 * Safe to call multiple times
 */
export function hydrateAuthStore() {
  if (typeof window !== 'undefined') {
    useAuthStore.persist.rehydrate();
    useAuthStore.setState({ isHydrated: true });
  }
}
