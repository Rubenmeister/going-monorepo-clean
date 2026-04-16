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
  setUser: (user: User) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isLoading: false,
  error: null,

  loadToken: async () => {
    set({ isLoading: true });
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const raw   = await AsyncStorage.getItem('auth_user');
      if (token && raw) {
        // Restaurar usuario desde storage (incluye firstName, lastName, etc.)
        set({ token, user: JSON.parse(raw), isLoading: false });
      } else if (token) {
        // Fallback: limpiar si no hay user guardado
        await AsyncStorage.removeItem('auth_token');
        set({ token: null, user: null, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      await AsyncStorage.multiRemove(['auth_token', 'auth_user']);
      set({ token: null, user: null, isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await authAPI.login(email, password);
      await AsyncStorage.setItem('auth_token', data.token);
      await AsyncStorage.setItem('auth_user', JSON.stringify(data.user));
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
      await AsyncStorage.setItem('auth_user', JSON.stringify(data.user));
      set({ token: data.token, user: data.user, isLoading: false });
    } catch (e: any) {
      set({
        error: e.response?.data?.message || 'Error al registrarse',
        isLoading: false,
      });
    }
  },

  logout: async () => {
    await AsyncStorage.multiRemove(['auth_token', 'auth_user']);
    set({ token: null, user: null });
  },

  clearError: () => set({ error: null }),

  setUser: async (user: User) => {
    await AsyncStorage.setItem('auth_user', JSON.stringify(user));
    set({ user });
  },
}));
