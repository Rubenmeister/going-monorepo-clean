import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('driver_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  vehiclePlate?: string;
  rating?: number;
  isOnline?: boolean;
}

interface DriverState {
  token: string | null;
  driver: Driver | null;
  isOnline: boolean;
  currentRideId: string | null;
  earnings: { today: number; week: number; total: number };
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadToken: () => Promise<void>;
  toggleOnline: () => Promise<void>;
  clearError: () => void;
}

export const useDriverStore = create<DriverState>((set, get) => ({
  token: null,
  driver: null,
  isOnline: false,
  currentRideId: null,
  earnings: { today: 0, week: 0, total: 0 },
  isLoading: false,
  error: null,

  loadToken: async () => {
    const token = await AsyncStorage.getItem('driver_token');
    if (!token) return;
    try {
      const { data } = await api.get('/api/auth/me');
      set({ token, driver: data });
    } catch {
      await AsyncStorage.removeItem('driver_token');
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/api/auth/login', {
        email,
        password,
        role: 'driver',
      });
      await AsyncStorage.setItem('driver_token', data.token);
      set({ token: data.token, driver: data.user, isLoading: false });
    } catch (e: any) {
      set({
        error: e.response?.data?.message || 'Error al iniciar sesión',
        isLoading: false,
      });
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem('driver_token');
    set({ token: null, driver: null, isOnline: false, currentRideId: null });
  },

  toggleOnline: async () => {
    const newStatus = !get().isOnline;
    set({ isOnline: newStatus });
    try {
      await api.patch('/api/transport/drivers/status', { isOnline: newStatus });
    } catch {
      set({ isOnline: !newStatus }); /* revert on error */
    }
  },

  clearError: () => set({ error: null }),
}));
