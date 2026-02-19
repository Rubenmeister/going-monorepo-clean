import { ok, err, Result } from 'neverthrow';
import { useAuthStore } from '@going-monorepo-clean/frontend-stores';

/**
 * Represents a decoded JWT payload
 */
interface JWTPayload {
  exp: number;
  iat: number;
  [key: string]: unknown;
}

/**
 * Token refresh response
 */
export interface TokenRefreshResponse {
  token: string;
  refreshToken?: string;
}

/**
 * Manages JWT token lifecycle including parsing, expiration detection, and refresh
 */
export class TokenManager {
  private static readonly REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes in milliseconds
  private static readonly MAX_RETRY_ATTEMPTS = 3;
  private static readonly INITIAL_RETRY_DELAY = 1000; // 1 second

  /**
   * Parse JWT token and extract payload
   */
  static decodeToken(token: string): JWTPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.warn('[TokenManager] Invalid token format');
        return null;
      }

      const payload = JSON.parse(
        Buffer.from(parts[1], 'base64').toString('utf-8')
      );
      return payload as JWTPayload;
    } catch (error) {
      console.error('[TokenManager] Failed to decode token:', error);
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  static isTokenExpired(token: string | null): boolean {
    if (!token) return true;

    const payload = this.decodeToken(token);
    if (!payload || !payload.exp) return true;

    const now = Date.now();
    const expTime = payload.exp * 1000; // Convert to milliseconds

    return now >= expTime;
  }

  /**
   * Check if token is near expiration (within threshold)
   */
  static isTokenNearExpiration(token: string | null): boolean {
    if (!token) return true;

    const payload = this.decodeToken(token);
    if (!payload || !payload.exp) return true;

    const now = Date.now();
    const expTime = payload.exp * 1000; // Convert to milliseconds
    const timeUntilExpiry = expTime - now;

    return timeUntilExpiry <= this.REFRESH_THRESHOLD;
  }

  /**
   * Get time remaining until token expiration (in milliseconds)
   */
  static getTokenExpirationTime(token: string | null): number | null {
    if (!token) return null;

    const payload = this.decodeToken(token);
    if (!payload || !payload.exp) return null;

    const now = Date.now();
    const expTime = payload.exp * 1000;

    return Math.max(0, expTime - now);
  }

  /**
   * Get the current token from store
   */
  static getToken(): string | null {
    return useAuthStore.getState().token;
  }

  /**
   * Get the refresh token from store
   */
  static getRefreshToken(): string | null {
    return useAuthStore.getState().refreshToken;
  }

  /**
   * Set tokens in store
   */
  static setToken(token: string, refreshToken?: string | null): void {
    const authStore = useAuthStore.getState();
    authStore.setToken(token, refreshToken);
  }

  /**
   * Clear tokens from store
   */
  static clearToken(): void {
    const authStore = useAuthStore.getState();
    authStore.clearAuth();
  }

  /**
   * Refresh token with retry logic
   * Returns Result with token on success or error on failure
   */
  static async refreshToken(): Promise<Result<TokenRefreshResponse, Error>> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      return err(new Error('No refresh token available'));
    }

    let lastError: Error | null = null;
    let delay = this.INITIAL_RETRY_DELAY;

    for (let attempt = 0; attempt < this.MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        const response = await fetch('http://localhost:3000/api/auth/refresh', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${refreshToken}`,
          },
          body: JSON.stringify({ refreshToken }),
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            // Unauthorized or Forbidden - clear auth and don't retry
            this.clearToken();
            return err(new Error('Token refresh failed: Unauthorized'));
          }

          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = (await response.json()) as TokenRefreshResponse;

        // Update tokens in store
        this.setToken(data.token, data.refreshToken);

        return ok(data);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Only retry on network errors, not on auth errors
        if (attempt < this.MAX_RETRY_ATTEMPTS - 1 && this.isNetworkError(lastError)) {
          console.warn(`[TokenManager] Refresh attempt ${attempt + 1} failed, retrying in ${delay}ms`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2; // Exponential backoff
        } else if (attempt === this.MAX_RETRY_ATTEMPTS - 1) {
          console.error('[TokenManager] Token refresh failed after all retries:', lastError);
        }
      }
    }

    return err(lastError || new Error('Token refresh failed'));
  }

  /**
   * Check if error is a network error (retryable)
   */
  private static isNetworkError(error: Error): boolean {
    const networkErrors = [
      'ECONNREFUSED',
      'ENOTFOUND',
      'ETIMEDOUT',
      'ECONNRESET',
      'Network error',
      'Failed to fetch',
    ];

    return networkErrors.some(
      (msg) =>
        error.message.includes(msg) ||
        error.message.toLowerCase().includes('network')
    );
  }

  /**
   * Check if token refresh is needed (token near expiration or expired)
   */
  static shouldRefreshToken(): boolean {
    const token = this.getToken();
    return this.isTokenNearExpiration(token);
  }

  /**
   * Perform token refresh if needed
   * Used as middleware for API calls
   */
  static async refreshIfNeeded(): Promise<Result<void, Error>> {
    if (!this.shouldRefreshToken()) {
      return ok(undefined);
    }

    const result = await this.refreshToken();

    if (result.isErr()) {
      return err(result.error);
    }

    return ok(undefined);
  }
}
