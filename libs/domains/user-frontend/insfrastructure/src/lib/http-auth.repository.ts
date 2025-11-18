import { Result, ok, err } from 'neverthrow';
import {
  IAuthRepository,
  AuthResponse,
  LoginCredentials,
  AuthenticatedUser,
} from '@going-monorepo-clean/domains-user-frontend-core'; // Reemplaza 'going-monorepo-clean' con el scope de tu monorepo

// Esta es la URL de tu API Gateway (la pondrías en un .env de frontend)
// Asegúrate de que tu Codespace pueda acceder a esta URL si el gateway está corriendo localmente
const API_GATEWAY_URL = 'http://localhost:3000/api';
const AUTH_TOKEN_KEY = 'authToken';

/**
 * Esta es la implementación "Adaptador" del puerto IAuthRepository.
 * Sabe cómo hablar con el API Gateway (HTTP) y el navegador (LocalStorage).
 */
export class HttpAuthRepository implements IAuthRepository {
  
  public async login(credentials: LoginCredentials): Promise<Result<AuthResponse, Error>> {
    try {
      // 1. Llama al endpoint /api/auth/login de tu Gateway
      const response = await fetch(`${API_GATEWAY_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        return err(new Error(data.message || 'Error de autenticación'));
      }

      // 2. Transforma la respuesta en la entidad del dominio
      const authUser = AuthenticatedUser.fromPrimitives(data.user);
      const authResponse: AuthResponse = {
        user: authUser,
        token: data.token,
      };

      // 3. Guarda el token en LocalStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(AUTH_TOKEN_KEY, data.token);
      }

      return ok(authResponse);
      
    } catch (error) {
      return err(new Error(error.message || 'Error de red al iniciar sesión'));
    }
  }

  public async loadSession(): Promise<Result<AuthResponse | null, Error>> {
    try {
      if (typeof window === 'undefined') {
        return ok(null); // No hay localStorage en el servidor
      }
      
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) {
        return ok(null); // No hay sesión guardada
      }
      
      // 4. (Opcional pero recomendado) Validar el token contra un endpoint de 'perfil'
      // Por ahora, asumimos que si el token existe, la sesión es válida.
      
      // Decodificamos el token (simplificado) para obtener los datos del usuario
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      const authUser = AuthenticatedUser.fromPrimitives({
        id: payload.sub,
        email: payload.email,
        firstName: payload.firstName || 'Usuario', // Asegúrate de que el backend envíe esto
        roles: payload.roles,
      });

      return ok({ user: authUser, token });

    } catch (error) {
      return err(new Error('Error al cargar la sesión'));
    }
  }

  public async logout(): Promise<Result<void, Error>> {
    try {
      if (typeof window !== 'undefined') {
        // 5. Simplemente borra el token del LocalStorage
        localStorage.removeItem(AUTH_TOKEN_KEY);
      }
      return ok(undefined);
    } catch (error) {
      return err(new Error('Error al cerrar sesión'));
    }
  }
}