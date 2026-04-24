import { httpClient } from './http.client';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export type LoginResponse = AuthTokens & { user: AuthUser };

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roles?: string[]; // optional — backend assigns default role
}

export type RegisterResponse = AuthTokens & { user: AuthUser };

export class AuthClient {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const result = await httpClient.post<LoginResponse>(
      '/auth/login',
      credentials
    );
    if (result.isOk()) {
      return result.value;
    }
    throw result.error;
  }

  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const result = await httpClient.post<RegisterResponse>(
      '/auth/register',
      data
    );
    if (result.isOk()) {
      return result.value;
    }
    throw result.error;
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const result = await httpClient.post<AuthTokens>(
      '/auth/refresh',
      { refreshToken }
    );
    if (result.isOk()) {
      return result.value;
    }
    throw result.error;
  }
}

export const authClient = new AuthClient();
