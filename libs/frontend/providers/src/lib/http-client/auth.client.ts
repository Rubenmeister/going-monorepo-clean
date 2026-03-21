import { httpClient } from './http.client';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
  };
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roles: string[];
}

export interface RegisterResponse {
  token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
  };
}

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
}

export const authClient = new AuthClient();
