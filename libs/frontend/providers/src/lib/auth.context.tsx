'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';

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
  logout: () => void;
}

const AUTH_TOKEN_KEY = 'authToken';

// --- React Context ---
const AuthContext = createContext<AuthState | null>(null);

// --- AuthProvider Component ---
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load session from localStorage on mount
  useEffect(() => {
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({
          id: payload.sub || payload.userId,
          firstName: payload.firstName || 'Usuario',
          roles: payload.roles || ['user'],
        });
      }
    } catch {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      setError('Sesión inválida. Por favor inicia sesión de nuevo.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setUser(null);
    setError(null);
  }, []);

  const value: AuthState = {
    user,
    isLoading,
    error,
    logout,
  };

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

// --- Login helper (used by useMonorepoApp) ---
export const loginUser = async (
  credentials: { email: string; password: string },
  setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>,
  setError: React.Dispatch<React.SetStateAction<string | null>>
) => {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.message || 'Error al iniciar sesión');
    }

    const data = await response.json();
    localStorage.setItem(AUTH_TOKEN_KEY, data.token);

    setUser({
      id: data.user?.id || data.userId,
      firstName: data.user?.firstName || 'Usuario',
      roles: data.user?.roles || ['user'],
    });
    setError(null);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Error desconocido';
    setError(message);
  }
};
