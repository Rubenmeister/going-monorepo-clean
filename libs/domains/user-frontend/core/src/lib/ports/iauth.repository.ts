import { Result } from 'neverthrow';
import { AuthenticatedUser } from '../entities/authenticated-user.entity';

// DTOs para los métodos
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: AuthenticatedUser;
  token: string;
}

// Symbol para inyección de dependencias
export const IAuthRepository = Symbol('IAuthRepository');

export interface IAuthRepository {
  /**
   * Intenta autenticar al usuario contra el API Gateway
   */
  login(credentials: LoginCredentials): Promise<Result<AuthResponse, Error>>;
  
  /**
   * Carga al usuario desde el almacenamiento local (ej. al recargar la página)
   */
  loadSession(): Promise<Result<AuthResponse | null, Error>>;

  /**
   * Cierra la sesión
   */
  logout(): Promise<Result<void, Error>>;
  
  // (Aquí irían register(), forgotPassword(), etc.)
}