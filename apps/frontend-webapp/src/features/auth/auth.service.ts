import { apiClient, AuthResponse } from '../../lib/api/client';

const AUTH_PATH = '/auth';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export const authService = {
  async register(data: any): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(`${AUTH_PATH}/register`, data);
    const { user, accessToken } = response.data;

    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', accessToken);
    return response.data;
  },

  async login(data: any): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(`${AUTH_PATH}/login`, data);
    const { user, accessToken } = response.data;

    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', accessToken);
    return response.data;
  },

  logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/login';
  },

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (userStr) return JSON.parse(userStr);
    return null;
  },

  getToken(): string | null {
    return localStorage.getItem('token');
  }
};
