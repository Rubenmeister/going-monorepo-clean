import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('auth_token');
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/api/auth/login', { email, password }),
  register: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone: string;
  }) => api.post('/api/auth/register', data),
  me: () => api.get('/api/auth/me'),
  logout: () => api.post('/api/auth/logout'),
};

// Transport / Rides
export const transportAPI = {
  requestRide: (data: {
    origin: { latitude: number; longitude: number; address: string };
    destination: { latitude: number; longitude: number; address: string };
    serviceType: 'PRIVATE' | 'SHARED';
  }) => api.post('/api/transport/rides', data),
  getRideStatus: (rideId: string) => api.get(`/api/transport/rides/${rideId}`),
  cancelRide: (rideId: string) => api.delete(`/api/transport/rides/${rideId}`),
};

// Bookings
export const bookingsAPI = {
  getAll: (page = 1, limit = 20) =>
    api.get('/api/bookings', { params: { page, limit } }),
  getById: (id: string) => api.get(`/api/bookings/${id}`),
};

// Search (unified across transport, tours, accommodations)
export const searchAPI = {
  search: (query: string, type?: string) =>
    api.get('/api/search', { params: { q: query, type } }),
  nearbyDrivers: (lat: number, lng: number) =>
    api.get('/api/transport/drivers/nearby', {
      params: { lat, lng, radius: 5000 },
    }),
};
