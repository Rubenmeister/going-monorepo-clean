import axios from 'axios';

const API_URL = '/api/auth';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export const authService = {
  async register(data: any): Promise<AuthResponse> {
    // Mock API call
    console.log('Mocking register for:', data);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Simulate successful response
    const mockResponse = {
      user: {
        id: '123',
        email: data.email,
        name: data.name,
        role: data.role || 'user'
      },
      accessToken: 'mock-jwt-token-123'
    };

    localStorage.setItem('user', JSON.stringify(mockResponse.user));
    localStorage.setItem('token', mockResponse.accessToken);
    return mockResponse;
  },

  async login(data: any): Promise<AuthResponse> {
    // Mock API call
    console.log('Mocking login for:', data);
    await new Promise(resolve => setTimeout(resolve, 800));

    const mockResponse = {
      user: {
        id: '123',
        email: data.email || 'user@example.com',
        name: 'Usuario Demo',
        role: 'user'
      },
      accessToken: 'mock-jwt-token-123'
    };

    localStorage.setItem('user', JSON.stringify(mockResponse.user));
    localStorage.setItem('token', mockResponse.accessToken);
    return mockResponse;
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
