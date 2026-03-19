'use client';
import { useAuth } from './auth.context';

// Llamadas de auth van por proxy Next.js (mismo origen → sin CORS)
// Resto de llamadas van directo al backend con token
const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
const AUTH_TOKEN_KEY = 'authToken';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

// Proxy interno de Next.js — no tiene CORS
async function authFetch(path: string, body: Record<string, unknown>) {
  const res = await fetch(`/api/auth${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { message?: string }).message || `HTTP ${res.status}`);
  }
  return data;
}

// Llamadas autenticadas al backend
async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...((options.headers as Record<string, string>) || {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { message?: string }).message || `HTTP ${res.status}`
    );
  }
  return res.json();
}

export const useMonorepoApp = () => {
  const auth = useAuth();
  return {
    auth,
    domain: {
      auth: {
        login: async (creds: { email: string; password: string }) => {
          const d = await authFetch('/login', creds);
          if (d.token && typeof window !== 'undefined') {
            localStorage.setItem(AUTH_TOKEN_KEY, d.token);
            window.location.reload();
          }
          return d;
        },
        register: async (data: Record<string, unknown>) => {
          const r = await authFetch('/register', data);
          if (r.token && typeof window !== 'undefined')
            localStorage.setItem(AUTH_TOKEN_KEY, r.token);
          return r;
        },
      },
      bookings: {
        create: async (dto: Record<string, unknown>) =>
          apiFetch('/bookings', { method: 'POST', body: JSON.stringify(dto) }),
        // JWT-based: userId extracted from token by the service
        findByUser: async (_userId: string) =>
          apiFetch('/bookings/my').catch(() => []),
        // Backend uses PATCH (not POST) for state transitions
        confirm: async (id: string) =>
          apiFetch(`/bookings/${id}/confirm`, { method: 'PATCH' }),
        cancel: async (id: string) =>
          apiFetch(`/bookings/${id}/cancel`, { method: 'PATCH' }),
      },
      transport: {
        // Backend exposes /transport/pending for listing, no /routes endpoint
        search: async (_params: Record<string, unknown>) =>
          apiFetch('/transport/pending').catch(() => []),
      },
      payments: {
        // Backend endpoint is /payments/process
        create: async (dto: Record<string, unknown>) =>
          apiFetch('/payments/process', { method: 'POST', body: JSON.stringify(dto) }),
      },
      parcels: {
        create: async (dto: Record<string, unknown>) =>
          apiFetch('/parcels', { method: 'POST', body: JSON.stringify(dto) }),
        // JWT-based: userId extracted from token by the service
        findByUser: async (_userId: string) =>
          apiFetch('/parcels/my').catch(() => []),
      },
      accommodations: {
        // Backend has /accommodations/search (no bare /accommodations GET)
        findAll: async () => apiFetch('/accommodations/search').catch(() => []),
        findById: async (id: string) => apiFetch(`/accommodations/${id}`),
      },
      tours: {
        // Backend has /tours/search (no bare /tours GET)
        findAll: async () => apiFetch('/tours/search').catch(() => []),
        findById: async (id: string) => apiFetch(`/tours/${id}`),
      },
      experiences: {
        // Backend has /experiences/search (no bare /experiences GET)
        findAll: async () => apiFetch('/experiences/search').catch(() => []),
        findById: async (id: string) => apiFetch(`/experiences/${id}`),
      },
      notifications: {
        // Backend: GET /notifications/user/:userId
        findByUser: async (userId: string) =>
          apiFetch(`/notifications/user/${userId}`).catch(() => []),
        // Backend: PATCH /notifications/:id/read
        markRead: async (id: string) =>
          apiFetch(`/notifications/${id}/read`, { method: 'PATCH' }),
      },
      tracking: {
        getStatus: async (bookingId: string) =>
          apiFetch(`/tracking/${bookingId}`).catch(() => null),
      },
    },
  };
};
