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
  loginWithOAuthToken: (token: string) => Promise<void>;
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
      // El backend puede devolver accessToken (core) o token (application layer)
      const authToken = data.accessToken || data.token;
      if (!authToken) throw new Error('No se recibió token de autenticación');
      await AsyncStorage.setItem('auth_token', authToken);
      await AsyncStorage.setItem('auth_user', JSON.stringify(data.user));
      set({ token: authToken, user: data.user, isLoading: false });
    } catch (e: any) {
      set({
        error: e.response?.data?.message || e.message || 'Error al iniciar sesión',
        isLoading: false,
      });
    }
  },

  register: async (formData) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await authAPI.register(formData);
      // El backend puede devolver accessToken (core) o token (application layer)
      const authToken = data.accessToken || data.token;
      if (!authToken) throw new Error('No se recibió token de autenticación');
      await AsyncStorage.setItem('auth_token', authToken);
      await AsyncStorage.setItem('auth_user', JSON.stringify(data.user));
      set({ token: authToken, user: data.user, isLoading: false });
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

  loginWithOAuthToken: async (token: string) => {
    set({ isLoading: true, error: null });
    try {
      await AsyncStorage.setItem('auth_token', token);
      // Fetch user profile with the received OAuth token
      const { data } = await authAPI.me();
      const user: User = {
        id:        data.userId || data.id,
        firstName: data.firstName || '',
        lastName:  data.lastName  || '',
        email:     data.email     || '',
        phone:     data.phone     || '',
        roles:     data.roles     || ['user'],
        avatar:    data.avatar,
      };
      await AsyncStorage.setItem('auth_user', JSON.stringify(user));
      set({ token, user, isLoading: false });
    } catch (e: any) {
      await AsyncStorage.removeItem('auth_token');
      set({
        token: null,
        user: null,
        error: 'Error al completar el inicio de sesión con red social.',
        isLoading: false,
      });
      throw e;
    }
  },

  setUser: async (user: User) => {
    await AsyncStorage.setItem('auth_user', JSON.stringify(user));
    set({ user });
  },
}));
