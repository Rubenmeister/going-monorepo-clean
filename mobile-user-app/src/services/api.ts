import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  'https://api-gateway-780842550857.us-central1.run.app';

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

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  register: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone: string;
  }) => api.post('/auth/register', { ...data, roles: ['user'] }),

  me: () => api.get('/auth/me'),
  logout: () => Promise.resolve(), // handled locally via store
};

// ── Transport ────────────────────────────────────────────────────────────────
export const transportAPI = {
  /**
   * Request a ride. Matches backend RequestTripDto:
   * { userId, origin: {address,latitude,longitude}, destination: {...}, price: {amount, currency} }
   */
  requestRide: (data: {
    userId: string;
    origin: { latitude: number; longitude: number; address: string };
    destination: { latitude: number; longitude: number; address: string };
    price?: { amount: number; currency: 'USD' };
  }) =>
    api.post('/transport/request', {
      userId: data.userId,
      origin: {
        address: data.origin.address,
        latitude: data.origin.latitude,
        longitude: data.origin.longitude,
      },
      destination: {
        address: data.destination.address,
        latitude: data.destination.latitude,
        longitude: data.destination.longitude,
      },
      price: data.price ?? { amount: 8.5, currency: 'USD' },
    }),

  /** Get pending trips (drivers nearby / available trips) */
  getPendingTrips: () => api.get('/transport/pending'),

  /** User trip history */
  getUserHistory: (userId: string) =>
    api.get(`/transport/user/${userId}/history`),
};

// ── Bookings ─────────────────────────────────────────────────────────────────
export const bookingsAPI = {
  getByUser: (userId: string) => api.get(`/bookings/user/${userId}`),
  getById: (id: string) => api.get(`/bookings/${id}`),
};

// ── Catalog search ────────────────────────────────────────────────────────────
export const searchAPI = {
  tours: (params?: { city?: string; category?: string; maxPrice?: number }) =>
    api.get('/tours/search', { params }),

  accommodations: (params?: {
    city?: string;
    country?: string;
    capacity?: number;
  }) => api.get('/accommodations/search', { params }),

  experiences: (params?: { city?: string; maxPrice?: number }) =>
    api.get('/experiences/search', { params }),
};

// ── Payments ─────────────────────────────────────────────────────────────────
export const paymentAPI = {
  createPaymentIntent: (data: {
    amount: number;
    currency: string;
    provider: 'mercadopago' | 'stripe';
    referenceId?: string;
  }) => api.post('/payments/intent', data),

  getPaymentStatus: (paymentId: string) =>
    api.get(`/payments/${paymentId}/status`),
};
