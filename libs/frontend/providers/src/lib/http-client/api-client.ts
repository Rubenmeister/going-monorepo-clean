import { Result } from 'neverthrow';
import { httpClient } from './http.client';
import { ApiError } from './api-error';

/**
 * Auth API DTOs
 */
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: 'user' | 'admin' | 'driver';
  };
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role?: string;
}

export interface RegisterResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  token: string;
  refreshToken?: string;
}

/**
 * User API DTOs
 */
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: string;
}

export interface UpdateProfileRequest {
  name?: string;
  avatar?: string;
}

/**
 * Centralized API client facade
 * Provides type-safe methods for all API endpoints
 */
export class ApiClient {
  private httpClient = httpClient;

  /**
   * Auth endpoints
   */
  auth = {
    login: (data: LoginRequest): Promise<Result<LoginResponse, ApiError>> =>
      this.httpClient.post<LoginResponse>('/auth/login', data),

    register: (
      data: RegisterRequest
    ): Promise<Result<RegisterResponse, ApiError>> =>
      this.httpClient.post<RegisterResponse>('/auth/register', data),

    refresh: (
      data: RefreshTokenRequest
    ): Promise<Result<RefreshTokenResponse, ApiError>> =>
      this.httpClient.post<RefreshTokenResponse>('/auth/refresh', data),

    logout: (): Promise<Result<void, ApiError>> =>
      this.httpClient.post<void>('/auth/logout', {}),
  };

  /**
   * User endpoints
   */
  user = {
    getProfile: (): Promise<Result<UserProfile, ApiError>> =>
      this.httpClient.get<UserProfile>('/user/profile'),

    updateProfile: (
      data: UpdateProfileRequest
    ): Promise<Result<UserProfile, ApiError>> =>
      this.httpClient.patch<UserProfile>('/user/profile', data),
  };

  /**
   * Generic method for custom endpoints
   * Use this for endpoints not explicitly defined above
   */
  get<T>(path: string): Promise<Result<T, ApiError>> {
    return this.httpClient.get<T>(path);
  }

  post<T>(path: string, data: unknown): Promise<Result<T, ApiError>> {
    return this.httpClient.post<T>(path, data);
  }

  patch<T>(path: string, data: unknown): Promise<Result<T, ApiError>> {
    return this.httpClient.patch<T>(path, data);
  }

  put<T>(path: string, data: unknown): Promise<Result<T, ApiError>> {
    return this.httpClient.put<T>(path, data);
  }

  delete<T>(path: string): Promise<Result<T, ApiError>> {
    return this.httpClient.delete<T>(path);
  }
}

/**
 * Global API client instance
 */
export const apiClient = new ApiClient();
