'use client';
// Re-exports the shared AuthProvider/useAuth backed by Zustand store.
// Single source of truth: useAuthStore (libs/frontend/stores).
export {
  AuthProvider,
  useAuth,
  useAuthStore,
} from '@going-monorepo-clean/frontend-providers';
export type { AuthUser, AuthState } from '@going-monorepo-clean/frontend-providers';
