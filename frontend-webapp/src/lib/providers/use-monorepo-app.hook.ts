'use client';
import { useAuth } from './auth.context';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
const AUTH_TOKEN_KEY = 'authToken';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

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
          const d = await apiFetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify(creds),
          });
          if (d.token && typeof window !== 'undefined') {
            localStorage.setItem(AUTH_TOKEN_KEY, d.token);
            window.location.reload();
          }
          return d;
        },
        register: async (data: Record<string, unknown>) => {
          const r = await apiFetch('/auth/register', {
            method: 'POST',
            body: JSON.stringify(data),
          });
          if (r.token && typeof window !== 'undefined')
            localStorage.setItem(AUTH_TOKEN_KEY, r.token);
          return r;
        },
      },
      bookings: {
        create: async (dto: Record<string, unknown>) =>
          apiFetch('/bookings', { method: 'POST', body: JSON.stringify(dto) }),
        findByUser: async (userId: string) =>
          apiFetch(`/bookings?userId=${userId}`).catch(() => []),
        confirm: async (id: string) =>
          apiFetch(`/bookings/${id}/confirm`, { method: 'POST' }),
        cancel: async (id: string) =>
          apiFetch(`/bookings/${id}/cancel`, { method: 'POST' }),
      },
      transport: {
        search: async (params: Record<string, unknown>) =>
          apiFetch(
            '/transport/routes?' +
              new URLSearchParams(params as Record<string, string>)
          ).catch(() => []),
      },
      payments: {
        create: async (dto: Record<string, unknown>) =>
          apiFetch('/payments', { method: 'POST', body: JSON.stringify(dto) }),
      },
      parcels: {
        create: async (dto: Record<string, unknown>) =>
          apiFetch('/parcels', { method: 'POST', body: JSON.stringify(dto) }),
        findByUser: async (userId: string) =>
          apiFetch(`/parcels?userId=${userId}`).catch(() => []),
      },
      accommodations: {
        findAll: async () => apiFetch('/accommodations').catch(() => []),
        findById: async (id: string) => apiFetch(`/accommodations/${id}`),
      },
      tours: {
        findAll: async () => apiFetch('/tours').catch(() => []),
        findById: async (id: string) => apiFetch(`/tours/${id}`),
      },
      experiences: {
        findAll: async () => apiFetch('/experiences').catch(() => []),
        findById: async (id: string) => apiFetch(`/experiences/${id}`),
      },
      notifications: {
        findByUser: async (userId: string) =>
          apiFetch(`/notifications?userId=${userId}`).catch(() => []),
        markRead: async (id: string) =>
          apiFetch(`/notifications/${id}/read`, { method: 'POST' }),
      },
      tracking: {
        getStatus: async (bookingId: string) =>
          apiFetch(`/tracking/${bookingId}`).catch(() => null),
      },
    },
  };
};
