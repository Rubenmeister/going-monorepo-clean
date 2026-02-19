import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosError,
  AxiosResponse,
} from 'axios';
import { TokenManager } from '../token-manager';
import { ApiError, createApiError } from './api-error';

/**
 * Request ID for tracking
 */
function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create and configure Axios instance with interceptors
 */
export function createAxiosInstance(): AxiosInstance {
  const instance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api',
    timeout: 15000, // 15 seconds
    headers: {
      'Content-Type': 'application/json',
    },
  });

  /**
   * Request Interceptor
   * - Add auth token to headers
   * - Add request ID for tracking
   * - Log requests in development
   */
  instance.interceptors.request.use(
    (config) => {
      const requestId = generateRequestId();
      config.headers['X-Request-ID'] = requestId;

      // Add auth token if available
      const token = TokenManager.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Log request in development
      if (process.env.NODE_ENV === 'development') {
        console.debug(`[HTTP Request] ${requestId}`, {
          method: config.method?.toUpperCase(),
          url: config.url,
          headers: config.headers,
        });
      }

      return config;
    },
    (error) => {
      console.error('[HTTP Request Error]', error);
      return Promise.reject(error);
    }
  );

  /**
   * Response Interceptor
   * - Handle successful responses
   * - Handle errors (401, 403, 5xx, network errors)
   * - Attempt token refresh on 401
   * - Log responses in development
   */
  instance.interceptors.response.use(
    (response) => {
      // Log response in development
      if (process.env.NODE_ENV === 'development') {
        console.debug(`[HTTP Response]`, {
          requestId: response.config.headers['X-Request-ID'],
          status: response.status,
          url: response.config.url,
        });
      }

      return response;
    },
    async (error: AxiosError) => {
      const config = error.config as AxiosRequestConfig & {
        _retryCount?: number;
        _originalRequest?: boolean;
      };
      const requestId = config?.headers?.['X-Request-ID'] as string;

      // Handle 401 - Attempt token refresh
      if (error.response?.status === 401 && !config?._originalRequest) {
        config._retryCount = (config?._retryCount || 0) + 1;

        if (config._retryCount <= 1) {
          // Only try refresh once per request
          config._originalRequest = true;

          const refreshResult = await TokenManager.refreshToken();

          if (refreshResult.isOk()) {
            // Token refreshed, retry original request with new token
            const token = TokenManager.getToken();
            if (token && config.headers) {
              config.headers.Authorization = `Bearer ${token}`;
              return instance(config);
            }
          } else {
            // Refresh failed, clear auth and reject
            TokenManager.clearToken();
            const apiError = createApiError(
              401,
              error.response?.data,
              {
                endpoint: config.url,
                method: config.method,
                requestId,
                details: { cause: 'Token refresh failed' },
              }
            );
            return Promise.reject(apiError);
          }
        }
      }

      // Handle 403 - Forbidden (clear auth and reject)
      if (error.response?.status === 403) {
        TokenManager.clearToken();
      }

      // Create appropriate API error
      const apiError = createApiError(
        error.response?.status || 0,
        error.response?.data,
        {
          endpoint: config?.url,
          method: config?.method,
          requestId,
          details: error.response?.data,
        }
      );

      // Log error
      console.error(`[HTTP Error] ${requestId}`, {
        status: error.response?.status,
        message: apiError.message,
        code: apiError.code,
      });

      return Promise.reject(apiError);
    }
  );

  return instance;
}

/**
 * Global Axios instance
 */
export const axiosInstance = createAxiosInstance();
