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

const AUTH_TOKEN_KEY = 'authToken';
const SESSION_COOKIE = 'going_webapp_session';
const AuthContext = createContext<AuthState | null>(null);

function setSessionCookie(value: boolean) {
  if (typeof document === 'undefined') return;
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
  const [error] = useState<string | null>(null);

  useEffect(() => {
    try {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem(AUTH_TOKEN_KEY)
          : null;
      if (token) {
        const parts = token.split('.');
        if (parts.length !== 3) throw new Error('Token malformado');
        const payload = JSON.parse(atob(parts[1]));

        // Verificar expiración
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          localStorage.removeItem(AUTH_TOKEN_KEY);
          setSessionCookie(false);
        } else {
          const roles: string[] = Array.isArray(payload.roles) ? payload.roles : [];
          setSessionCookie(true);
          setUser({
            id: payload.sub || payload.userId || '',
            firstName: payload.firstName || payload.name || 'User',
            lastName: payload.lastName,
            email: payload.email,
            roles,
            isAdmin: () => roles.includes('admin'),
          });
        }
      }
    } catch {
      if (typeof window !== 'undefined')
        localStorage.removeItem(AUTH_TOKEN_KEY);
      setSessionCookie(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    if (typeof window !== 'undefined') localStorage.removeItem(AUTH_TOKEN_KEY);
    setSessionCookie(false);
    setUser(null);
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
