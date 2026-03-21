'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';

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

const AUTH_TOKEN_KEY   = 'authToken';
const SESSION_COOKIE   = 'going_admin_session';
const AuthContext = createContext<AuthState | null>(null);

/** Escribe/borra la cookie que el middleware lee para proteger rutas. */
function setSessionCookie(value: boolean) {
  if (value) {
    document.cookie = `${SESSION_COOKIE}=1; path=/; SameSite=Strict`;
  } else {
    document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; SameSite=Strict`;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (token) {
        const parts = token.split('.');
        if (parts.length !== 3) throw new Error('Token malformado');

        const payload = JSON.parse(atob(parts[1]));

        // Verificar expiración: exp es Unix timestamp en segundos
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          localStorage.removeItem(AUTH_TOKEN_KEY);
        } else {
          const roles: string[] = Array.isArray(payload.roles) ? payload.roles : [];

          // Solo permitir acceso a usuarios con rol admin
          if (!roles.includes('admin')) {
            localStorage.removeItem(AUTH_TOKEN_KEY);
            throw new Error('Forbidden: admin role required');
          }

          setSessionCookie(true);
          setUser({
            id: payload.sub || payload.userId,
            firstName: payload.firstName || 'Admin',
            roles,
            isAdmin: () => roles.includes('admin'),
          });
        }
      }
    } catch {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setSessionCookie(false);
    setUser(null);
    setError(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, error, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthState => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
