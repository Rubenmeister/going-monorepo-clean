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
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `HTTP ${res.status}`);
  }
  return res.json();
}

export const useMonorepoApp = () => {
  const auth = useAuth();

  return {
    auth,
    domain: {
      auth: {
        login: async (credentials: { email: string; password: string }) => {
          const data = await apiFetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
          });
          localStorage.setItem(AUTH_TOKEN_KEY, data.token);
          window.location.href = '/';
          return data;
        },
        register: async (data: {
          email: string;
          password: string;
          firstName: string;
          lastName: string;
          phone?: string;
          roles: string[];
        }) => {
          const res = await apiFetch('/auth/register', {
            method: 'POST',
            body: JSON.stringify(data),
          });
          if (res.token) localStorage.setItem(AUTH_TOKEN_KEY, res.token);
          return res;
        },
      },
      admin: {
        getStats: async () =>
          apiFetch('/auth/admin/stats').catch(() => ({
            total: 0,
            active: 0,
            suspended: 0,
            admins: 0,
            drivers: 0,
          })),
        getUsers: async (params?: {
          limit?: number;
          skip?: number;
          role?: string;
          status?: string;
        }) => {
          const qs = new URLSearchParams();
          if (params?.limit) qs.set('limit', String(params.limit));
          if (params?.skip) qs.set('skip', String(params.skip));
          if (params?.role) qs.set('role', params.role);
          if (params?.status) qs.set('status', params.status);
          const query = qs.toString() ? `?${qs}` : '';
          return apiFetch(`/auth/admin/users${query}`).catch(() => ({
            users: [],
            total: 0,
          }));
        },
        updateUserStatus: async (id: string, status: string) =>
          apiFetch(`/auth/admin/users/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
          }),
      },
      bookings: {
        create: async (dto: unknown) =>
          apiFetch('/bookings', { method: 'POST', body: JSON.stringify(dto) }),
        findByUser: async (userId: string) =>
          apiFetch(`/bookings?userId=${userId}`).catch(() => []),
        confirm: async (bookingId: string) =>
          apiFetch(`/bookings/${bookingId}/confirm`, { method: 'POST' }),
        cancel: async (bookingId: string) =>
          apiFetch(`/bookings/${bookingId}/cancel`, { method: 'POST' }),
      },
      transport: {
        requestTrip: async (dto: unknown) =>
          apiFetch('/transport/trips', {
            method: 'POST',
            body: JSON.stringify(dto),
          }),
        acceptTrip: async (tripId: string, driverId: string) =>
          apiFetch(`/transport/trips/${tripId}/accept`, {
            method: 'POST',
            body: JSON.stringify({ driverId }),
          }),
      },
      payment: {
        requestIntent: async (dto: unknown) =>
          apiFetch('/payments/intent', {
            method: 'POST',
            body: JSON.stringify(dto),
          }),
      },
      parcel: {
        create: async (dto: unknown) =>
          apiFetch('/parcels', { method: 'POST', body: JSON.stringify(dto) }),
        findByUser: async (userId: string) =>
          apiFetch(`/parcels?userId=${userId}`).catch(() => []),
      },
      accommodation: {
        create: async (dto: unknown) =>
          apiFetch('/accommodations', {
            method: 'POST',
            body: JSON.stringify(dto),
          }),
        search: async (query: unknown) =>
          apiFetch(
            `/accommodations?${new URLSearchParams(
              query as Record<string, string>
            )}`
          ).catch(() => []),
      },
      tour: {
        create: async (dto: unknown) =>
          apiFetch('/tours', { method: 'POST', body: JSON.stringify(dto) }),
        search: async (query: unknown) =>
          apiFetch(
            `/tours?${new URLSearchParams(query as Record<string, string>)}`
          ).catch(() => []),
      },
      experience: {
        create: async (dto: unknown) =>
          apiFetch('/experiences', {
            method: 'POST',
            body: JSON.stringify(dto),
          }),
        search: async (query: unknown) =>
          apiFetch(
            `/experiences?${new URLSearchParams(
              query as Record<string, string>
            )}`
          ).catch(() => []),
      },
      notifications: {
        send: async (dto: unknown) =>
          apiFetch('/notifications', {
            method: 'POST',
            body: JSON.stringify(dto),
          }),
        getByUser: async (userId: string) =>
          apiFetch(`/notifications?userId=${userId}`).catch(() => []),
      },
      tracking: {
        broadcastDriverLocation: async (dto: unknown) =>
          apiFetch('/tracking/location', {
            method: 'POST',
            body: JSON.stringify(dto),
          }),
        getActiveDrivers: async () =>
          apiFetch('/tracking/drivers').catch(() => []),
        connectWebSocket: async () => {},
      },
    },
  };
};
