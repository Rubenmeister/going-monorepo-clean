import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { env } from '../../config';

/**
 * Centralized API client with interceptors for:
 * - Auto-attaching JWT token
 * - Centralized error handling
 * - Request/Response logging
 */

// Create axios instance with base config
export const apiClient: AxiosInstance = axios.create({
  baseURL: env.apiUrl,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (env.appEnv === 'development') {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;
    
    // Handle specific error codes
    if (status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login?expired=true';
    }
    
    if (status === 403) {
      console.error('[API] Forbidden - insufficient permissions');
    }
    
    if (status === 500) {
      console.error('[API] Server error:', error.response?.data);
    }
    
    // Network error
    if (!error.response) {
      console.error('[API] Network error - check connection');
    }
    
    return Promise.reject(error);
  }
);

// Helper types
export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

// Helper to extract error message
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message || 'An error occurred';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

export default apiClient;
