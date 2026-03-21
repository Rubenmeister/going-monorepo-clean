import { API_CONFIG } from '../config/api-config';
import type { ApiError } from '../types';

export class FetchClient {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl = API_CONFIG.baseUrl, timeout = API_CONFIG.timeout) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  async request<T>(method: string, url: string, data?: any): Promise<T> {
    const fullUrl = `${this.baseUrl}${url}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add auth token if available
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(fullUrl, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw this.createApiError(response.status, await response.text());
      }

      return response.json();
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw this.createApiError(0, 'Request timeout');
      }
      throw error;
    }
  }

  async get<T>(url: string): Promise<T> {
    return this.request('GET', url);
  }

  async post<T>(url: string, data: any): Promise<T> {
    return this.request('POST', url, data);
  }

  async put<T>(url: string, data: any): Promise<T> {
    return this.request('PUT', url, data);
  }

  async delete<T>(url: string): Promise<T> {
    return this.request('DELETE', url);
  }

  private createApiError(statusCode: number, message: string): ApiError {
    return {
      statusCode,
      code: `HTTP_${statusCode}`,
      message,
    };
  }
}

export const apiClient = new FetchClient();
