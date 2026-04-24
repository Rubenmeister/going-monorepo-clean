'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { useAuthStore } from '@going-monorepo-clean/frontend-stores';

// --- Auth Types ---
export interface AuthUser {
  id: string;
  firstName: string;
  lastName?: string;
  email?: string;
  roles: string[];
  isAdmin?: () => boolean;
}

export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  logout: () => void;
}

// --- React Context ---
const AuthContext = createContext<AuthState | null>(null);

// --- AuthProvider Component ---
// Thin wrapper over Zustand auth store — single source of truth.
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const storeUser = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  // Map store UserProfile → AuthUser shape consumed by existing components
  const user: AuthUser | null = storeUser
    ? {
        id: storeUser.id,
        firstName: storeUser.name?.split(' ')[0] ?? '',
        lastName: storeUser.name?.split(' ').slice(1).join(' ') || undefined,
        email: storeUser.email,
        roles: storeUser.roles ?? (storeUser.role ? [storeUser.role] : []),
        isAdmin: storeUser.isAdmin,
      }
    : null;

  const value = useMemo<AuthState>(
    () => ({
      user,
      isLoading,
      error,
      isAuthenticated: Boolean(token && storeUser),
      logout: () => clearAuth(),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [storeUser, token, isLoading, error, clearAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// --- useAuth Hook ---
export const useAuth = (): AuthState => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Re-export store for consumers that need direct access
export { useAuthStore };
