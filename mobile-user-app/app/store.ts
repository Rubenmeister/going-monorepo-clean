'use client';
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  'https://api-gateway-780842550857.us-central1.run.app';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  isReady: boolean;
  init: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (d: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  token: null,
  isReady: false,

  async init() {
    try {
      const token = await AsyncStorage.getItem('going_token');
      const raw = await AsyncStorage.getItem('going_user');
      set({ token, user: raw ? JSON.parse(raw) : null, isReady: true });
    } catch {
      set({ token: null, user: null, isReady: true });
    }
  },

  async login(email, password) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      throw new Error((e as any).message || 'Credenciales incorrectas');
    }
    const { token, user } = await res.json();
    await AsyncStorage.setItem('going_token', token);
    await AsyncStorage.setItem('going_user', JSON.stringify(user));
    set({ token, user });
  },

  async register({ firstName, lastName, email, password, phone }) {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName,
        lastName,
        email,
        password,
        phone,
        roles: ['user'],
      }),
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      throw new Error((e as any).message || 'Error al registrarse');
    }
    const { token, user } = await res.json();
    await AsyncStorage.setItem('going_token', token);
    await AsyncStorage.setItem('going_user', JSON.stringify(user));
    set({ token, user });
  },

  async logout() {
    await AsyncStorage.removeItem('going_token');
    await AsyncStorage.removeItem('going_user');
    set({ user: null, token: null });
  },
}));

export function authFetch(path: string, options: RequestInit = {}) {
  const token = useAuth.getState().token;
  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
}
