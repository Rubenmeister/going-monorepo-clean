'use client';

import React, { createContext, useContext, useMemo, useState } from 'react';
import { useAuthStore } from '@/lib/stores';

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

/**
 * Decodifica el payload de un JWT y devuelve un perfil sintético mínimo.
 * Sin verificación de firma — solo parseo para evitar el flash de
 * "Ingresar" mientras Zustand rehidrata su persist desde localStorage.
 */
function fallbackUserFromLocalStorage(): { user: AuthUser; token: string } | null {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('authToken') || localStorage.getItem('auth_token');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) return null; // expirado, no preauth
    const email: string = payload.email || '';
    const firstName = email.split('@')[0] || 'Cuenta';
    return {
      token,
      user: {
        id: payload.sub || '',
        firstName,
        email,
        roles: payload.roles || [],
      },
    };
  } catch {
    return null;
  }
}

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

  // Fallback sincrónico para evitar el flash "Ingresar" en el primer
  // render. Si hay un JWT válido en localStorage decodificamos un perfil
  // mínimo (id, email, roles) y lo usamos hasta que el store rehidrate.
  // useState con initializer asegura que sólo se ejecuta una vez por mount.
  const [initialFallback] = useState(fallbackUserFromLocalStorage);

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
    : initialFallback?.user ?? null;

  const effectiveToken = token || initialFallback?.token || null;

  const value = useMemo<AuthState>(
    () => ({
      user,
      isLoading,
      error,
      isAuthenticated: Boolean(effectiveToken && user),
      logout: () => clearAuth(),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, effectiveToken, isLoading, error, clearAuth]
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
