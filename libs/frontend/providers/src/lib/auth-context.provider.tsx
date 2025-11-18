'use client'; // Marcar como componente de cliente

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { Result } from 'neverthrow';
import {
  AuthenticatedUser,
  LoginCredentials,
} from '@going-monorepo-clean/domains-user-frontend-core';
import { dependencyProvider } from './dependency-provider'; // Importamos nuestro inyector

// 1. Definir la forma del estado de autenticación
interface AuthState {
  user: AuthenticatedUser | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<Result<void, Error>>;
  logout: () => void;
}

// 2. Crear el Contexto
const AuthContext = createContext<AuthState | undefined>(undefined);

// 3. Crear el Componente "Proveedor"
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Empieza en true para cargar la sesión
  const [error, setError] = useState<string | null>(null);

  // Casos de Uso (del inyector)
  const { loginUseCase, loadSessionUseCase } = dependencyProvider;

  // Efecto para cargar la sesión al iniciar la app
  useEffect(() => {
    const loadUserSession = async () => {
      setIsLoading(true);
      const sessionResult = await loadSessionUseCase.execute();
      if (sessionResult.isOk() && sessionResult.value) {
        setUser(sessionResult.value.user);
        setToken(sessionResult.value.token);
      }
      setIsLoading(false);
    };
    loadUserSession();
  }, [loadSessionUseCase]);

  // Función de Login (que llamará el componente de UI)
  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);

    const result = await loginUseCase.execute(credentials);

    if (result.isOk()) {
      // Éxito: actualiza el estado
      setUser(result.value.user);
      setToken(result.value.token);
      setIsLoading(false);
      return ok(undefined);
    } else {
      // Error: actualiza el error
      setError(result.error.message);
      setIsLoading(false);
      return err(result.error);
    }
  };

  // Función de Logout
  const logout = () => {
    // (Aquí llamaríamos a un 'logoutUseCase' si existiera)
    localStorage.removeItem('authToken'); // O mejor, que lo haga el repositorio
    setUser(null);
    setToken(null);
  };

  const value = { user, token, isLoading, error, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 4. Crear el Hook Personalizado
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};