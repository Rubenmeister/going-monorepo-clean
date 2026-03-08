'use client';
import { create } from 'zustand';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
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
  init: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (d: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone: string;
  }) => Promise<void>;
  logout: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  token: null,
  isReady: false,

  init() {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('going_token');
    const raw = localStorage.getItem('going_user');
    set({ token, user: raw ? JSON.parse(raw) : null, isReady: true });
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
    localStorage.setItem('going_token', token);
    localStorage.setItem('going_user', JSON.stringify(user));
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
    localStorage.setItem('going_token', token);
    localStorage.setItem('going_user', JSON.stringify(user));
    set({ token, user });
  },

  logout() {
    localStorage.removeItem('going_token');
    localStorage.removeItem('going_user');
    set({ user: null, token: null });
  },
}));

export function authFetch(path: string, options: RequestInit = {}) {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('going_token') : null;
  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
}
