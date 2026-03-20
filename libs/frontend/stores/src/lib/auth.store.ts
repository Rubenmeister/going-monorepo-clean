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
  role: 'user' | 'admin' | 'driver';
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
