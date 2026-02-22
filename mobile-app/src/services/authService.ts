/**
 * Authentication Service
 * Handles JWT token management, refresh, and secure storage
 * Prevents token expiry crashes with automatic refresh
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosInstance } from 'axios';
import { v4 as uuid } from 'uuid';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  issuedAt: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  roles: string[];
}

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'auth_access_token',
  REFRESH_TOKEN: 'auth_refresh_token',
  USER: 'auth_user',
  TOKEN_EXPIRY: 'auth_token_expiry',
};

const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // Refresh 5 minutes before expiry

export class AuthService {
  private api: AxiosInstance;
  private tokens: AuthTokens | null = null;
  private user: User | null = null;
  private refreshPromise: Promise<AuthTokens | null> | null = null;
  private refreshTimeout: NodeJS.Timeout | null = null;
  private authCallbacks: ((user: User | null) => void)[] = [];
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.api = axios.create({
      baseURL,
      timeout: 10000,
    });

    // Add request interceptor for token injection
    this.api.interceptors.request.use((config) => {
      if (this.tokens?.accessToken) {
        config.headers.Authorization = `Bearer ${this.tokens.accessToken}`;
        config.headers['X-Request-ID'] = uuid();
      }
      return config;
    });

    // Add response interceptor for token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 && !error.config._retry) {
          error.config._retry = true;

          try {
            await this.refreshAccessToken();
            return this.api(error.config);
          } catch (refreshError) {
            await this.logout();
            throw refreshError;
          }
        }
        throw error;
      }
    );

    this.loadStoredTokens();
  }

  /**
   * Login user with credentials
   */
  async login(email: string, password: string): Promise<User> {
    try {
      const response = await this.api.post('/auth/login', {
        email,
        password,
      });

      const { accessToken, refreshToken, expiresIn, user } = response.data;

      this.tokens = {
        accessToken,
        refreshToken,
        expiresIn,
        issuedAt: Date.now(),
      };

      this.user = user;

      // Store tokens securely
      await this.storeTokens();

      // Setup auto-refresh
      this.scheduleTokenRefresh();

      // Notify listeners
      this.notifyAuthChange(user);

      return user;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   * Prevents 401 errors from expired tokens
   */
  async refreshAccessToken(): Promise<AuthTokens | null> {
    // Avoid multiple simultaneous refresh attempts
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        if (!this.tokens?.refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(`${this.baseURL}/auth/refresh`, {
          refreshToken: this.tokens.refreshToken,
        });

        const { accessToken, expiresIn } = response.data;

        this.tokens = {
          ...this.tokens,
          accessToken,
          expiresIn,
          issuedAt: Date.now(),
        };

        // Update stored tokens
        await this.storeTokens();

        // Reschedule refresh
        this.scheduleTokenRefresh();

        console.log('Token refreshed successfully');

        return this.tokens;
      } catch (error) {
        console.error('Token refresh failed:', error);
        await this.logout();
        return null;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  /**
   * Logout user and clear tokens
   */
  async logout(): Promise<void> {
    try {
      // Call logout API
      if (this.tokens?.accessToken) {
        try {
          await this.api.post('/auth/logout', {
            refreshToken: this.tokens.refreshToken,
          });
        } catch (error) {
          console.warn('Logout API call failed, clearing local tokens anyway');
        }
      }

      // Clear tokens
      this.tokens = null;
      this.user = null;

      // Cancel scheduled refresh
      if (this.refreshTimeout) {
        clearTimeout(this.refreshTimeout);
        this.refreshTimeout = null;
      }

      // Clear storage
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER,
        STORAGE_KEYS.TOKEN_EXPIRY,
      ]);

      // Notify listeners
      this.notifyAuthChange(null);

      console.log('User logged out');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.tokens?.accessToken && !!this.user;
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.user;
  }

  /**
   * Get access token
   */
  getAccessToken(): string | null {
    return this.tokens?.accessToken || null;
  }

  /**
   * Check if token needs refresh
   */
  needsRefresh(): boolean {
    if (!this.tokens) return false;

    const expiryTime = this.tokens.issuedAt + this.tokens.expiresIn * 1000;
    const now = Date.now();

    return expiryTime - now < TOKEN_REFRESH_THRESHOLD;
  }

  /**
   * Subscribe to authentication changes
   */
  onAuthChange(callback: (user: User | null) => void): () => void {
    this.authCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      this.authCallbacks = this.authCallbacks.filter((cb) => cb !== callback);
    };
  }

  /**
   * Make API request with token management
   */
  async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any
  ): Promise<T> {
    // Check if token needs refresh
    if (this.needsRefresh()) {
      await this.refreshAccessToken();
    }

    const response = await this.api({
      method,
      url: endpoint,
      data,
    });

    return response.data;
  }

  /**
   * Private methods
   */

  private async storeTokens(): Promise<void> {
    try {
      if (!this.tokens) return;

      const expiryTime = this.tokens.issuedAt + this.tokens.expiresIn * 1000;

      await AsyncStorage.multiSet([
        [STORAGE_KEYS.ACCESS_TOKEN, this.tokens.accessToken],
        [STORAGE_KEYS.REFRESH_TOKEN, this.tokens.refreshToken],
        [STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toString()],
        [STORAGE_KEYS.USER, this.user ? JSON.stringify(this.user) : ''],
      ]);
    } catch (error) {
      console.error('Failed to store tokens:', error);
    }
  }

  private async loadStoredTokens(): Promise<void> {
    try {
      const values = await AsyncStorage.multiGet([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.TOKEN_EXPIRY,
        STORAGE_KEYS.USER,
      ]);

      const [[, accessToken], [, refreshToken], [, expiryTime], [, userStr]] =
        values;

      if (accessToken && refreshToken && expiryTime) {
        const issuedAt = parseInt(expiryTime) - 900000; // Assume 15 min expiry
        const expiresIn = 900;

        this.tokens = {
          accessToken,
          refreshToken,
          expiresIn,
          issuedAt,
        };

        if (userStr) {
          this.user = JSON.parse(userStr);
        }

        // Check if token is still valid
        if (Date.now() < parseInt(expiryTime)) {
          this.scheduleTokenRefresh();
          this.notifyAuthChange(this.user);
        } else {
          // Token expired, need to refresh
          await this.refreshAccessToken();
        }
      }
    } catch (error) {
      console.error('Failed to load stored tokens:', error);
    }
  }

  private scheduleTokenRefresh(): void {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }

    if (!this.tokens) return;

    const expiryTime = this.tokens.issuedAt + this.tokens.expiresIn * 1000;
    const refreshTime = expiryTime - TOKEN_REFRESH_THRESHOLD;
    const delay = Math.max(0, refreshTime - Date.now());

    this.refreshTimeout = setTimeout(() => {
      this.refreshAccessToken();
    }, delay);
  }

  private notifyAuthChange(user: User | null): void {
    this.authCallbacks.forEach((cb) => cb(user));
  }
}

// Export singleton
export const authService = new AuthService(
  process.env.REACT_APP_API_URL || 'http://localhost:3333'
);
