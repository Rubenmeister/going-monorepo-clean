import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '@services/api';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  roles: string[];
  avatar?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  loadToken: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isLoading: false,
  error: null,

  loadToken: async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        const { data } = await authAPI.me();
        set({ token, user: data });
      }
    } catch {
      await AsyncStorage.removeItem('auth_token');
      set({ token: null, user: null });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await authAPI.login(email, password);
      await AsyncStorage.setItem('auth_token', data.token);
      set({ token: data.token, user: data.user, isLoading: false });
    } catch (e: any) {
      set({
        error: e.response?.data?.message || 'Error al iniciar sesión',
        isLoading: false,
      });
    }
  },

  register: async (formData) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await authAPI.register(formData);
      await AsyncStorage.setItem('auth_token', data.token);
      set({ token: data.token, user: data.user, isLoading: false });
    } catch (e: any) {
      set({
        error: e.response?.data?.message || 'Error al registrarse',
        isLoading: false,
      });
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem('auth_token');
    set({ token: null, user: null });
  },

  clearError: () => set({ error: null }),
}));
