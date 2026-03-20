'use client';
import { create } from 'zustand';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  'https://api.goingec.com';

export interface Driver {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

interface DriverState {
  driver: Driver | null;
  token: string | null;
  isReady: boolean;
  isOnline: boolean;
  init: () => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  toggleOnline: () => void;
}

export const useDriver = create<DriverState>((set, get) => ({
  driver: null,
  token: null,
  isReady: false,
  isOnline: false,

  init() {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('going_driver_token');
    const raw = localStorage.getItem('going_driver');
    const isOnline = localStorage.getItem('going_driver_online') === 'true';
    set({
      token,
      driver: raw ? JSON.parse(raw) : null,
      isOnline,
      isReady: true,
    });
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
    if (!user.roles?.includes('driver')) {
      throw new Error('Esta cuenta no tiene rol de conductor');
    }
    localStorage.setItem('going_driver_token', token);
    localStorage.setItem('going_driver', JSON.stringify(user));
    set({ token, driver: user });
  },

  logout() {
    localStorage.removeItem('going_driver_token');
    localStorage.removeItem('going_driver');
    localStorage.removeItem('going_driver_online');
    set({ driver: null, token: null, isOnline: false });
  },

  toggleOnline() {
    const next = !get().isOnline;
    localStorage.setItem('going_driver_online', String(next));
    set({ isOnline: next });
  },
}));

export function driverFetch(path: string, options: RequestInit = {}) {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('going_driver_token')
      : null;
  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
}
