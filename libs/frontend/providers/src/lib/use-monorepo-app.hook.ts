'use client';

import { useAuth } from './auth.context';

/**
 * Hook principal de la webapp.
 * Retorna el estado de autenticación y los casos de uso de cada dominio.
 *
 * Los dominios que aún no tienen infraestructura frontend (core/infrastructure)
 * usan stubs que logean la acción a consola. Se reemplazarán cuando las capas
 * core e infrastructure de cada dominio frontend estén listas.
 */
export const useMonorepoApp = () => {
  const authState = useAuth();

  return {
    // 1. ESTADO GLOBAL DE AUTH
    auth: authState,

    // 2. CASOS DE USO (Domain Actions)
    domain: {
      // --- Auth ---
      auth: {
        login: async (credentials: { email: string; password: string }) => {
          try {
            const response = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(credentials),
            });

            if (!response.ok) {
              const body = await response.json().catch(() => ({}));
              console.error('[auth.login] Error:', body.message || response.statusText);
              return;
            }

            const data = await response.json();
            localStorage.setItem('authToken', data.token);
            // Reload to pick up the new session
            window.location.reload();
          } catch (e) {
            console.error('[auth.login] Network error:', e);
          }
        },
      },

      // --- Booking ---
      bookings: {
        create: async (dto: unknown) => {
          console.log('[bookings.create] Stub - infraestructura pendiente:', dto);
        },
        findByUser: async (userId: string) => {
          console.log('[bookings.findByUser] Stub - infraestructura pendiente:', userId);
          return [];
        },
      },

      // --- Transport ---
      transport: {
        requestTrip: async (dto: unknown) => {
          console.log('[transport.requestTrip] Stub - infraestructura pendiente:', dto);
        },
        getActiveTrip: async () => {
          console.log('[transport.getActiveTrip] Stub - infraestructura pendiente');
          return null;
        },
      },

      // --- Payment ---
      payment: {
        requestIntent: async (dto: unknown) => {
          console.log('[payment.requestIntent] Stub - infraestructura pendiente:', dto);
        },
      },

      // --- Parcel ---
      parcel: {
        create: async (dto: unknown) => {
          console.log('[parcel.create] Stub - infraestructura pendiente:', dto);
        },
        findByUser: async (userId: string) => {
          console.log('[parcel.findByUser] Stub - infraestructura pendiente:', userId);
          return [];
        },
      },

      // --- Accommodation ---
      accommodation: {
        search: async (query: unknown) => {
          console.log('[accommodation.search] Stub - infraestructura pendiente:', query);
          return [];
        },
      },

      // --- Tour ---
      tour: {
        search: async (query: unknown) => {
          console.log('[tour.search] Stub - infraestructura pendiente:', query);
          return [];
        },
      },

      // --- Tracking ---
      tracking: {
        broadcastDriverLocation: async (dto: unknown) => {
          console.log('[tracking.broadcast] Stub - infraestructura pendiente:', dto);
        },
        getActiveDrivers: async () => {
          console.log('[tracking.getActiveDrivers] Stub - infraestructura pendiente');
          return [];
        },
      },

      // --- Notifications ---
      notifications: {
        getByUser: async () => {
          console.log('[notifications.getByUser] Stub - infraestructura pendiente');
          return [];
        },
      },
    },
  };
};
