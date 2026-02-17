/**
 * Base HTTP client for all API calls.
 * Handles JWT authentication, error handling, and request/response formatting.
 */

const API_BASE_URL = 'http://localhost:3000/api';

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

export class HttpClient {
  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authToken');
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const token = this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    return this.fetch<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async get<T>(path: string): Promise<T> {
    return this.fetch<T>(path, {
      method: 'GET',
    });
  }

  async patch<T>(path: string, body: unknown): Promise<T> {
    return this.fetch<T>(path, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  private async fetch<T>(
    path: string,
    options: FetchOptions
  ): Promise<T> {
    const url = `${API_BASE_URL}${path}`;
    const headers = this.getHeaders();

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.message ||
          `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Network error';
      console.error(`[HttpClient] ${options.method} ${path}:`, message);
      throw error;
    }
  }
}

export const httpClient = new HttpClient();
