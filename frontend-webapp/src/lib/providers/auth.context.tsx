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
const AuthContext = createContext<AuthState | null>(null);

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
        const payload = JSON.parse(atob(token.split('.')[1]));
        const roles: string[] = payload.roles || [];
        setUser({
          id: payload.sub || payload.userId || '',
          firstName: payload.firstName || payload.name || 'User',
          lastName: payload.lastName,
          email: payload.email,
          roles,
          isAdmin: () => roles.includes('admin'),
        });
      }
    } catch {
      if (typeof window !== 'undefined')
        localStorage.removeItem(AUTH_TOKEN_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    if (typeof window !== 'undefined') localStorage.removeItem(AUTH_TOKEN_KEY);
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
