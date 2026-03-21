/**
 * Common API type definitions
 */

export interface ApiRequest<T = unknown> {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  data?: T;
  headers?: Record<string, string>;
  params?: Record<string, unknown>;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  error?: ApiError;
  statusCode: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}
