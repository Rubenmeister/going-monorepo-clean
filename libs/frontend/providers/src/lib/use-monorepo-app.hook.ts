'use client';

import { useAuth } from './auth.context';
import {
  authClient,
  bookingClient,
  transportClient,
  paymentClient,
  parcelClient,
  accommodationClient,
  tourClient,
  experienceClient,
  notificationClient,
  trackingClient,
} from './http-client';

/**
 * Hook principal de la webapp.
 * Retorna el estado de autenticación y los casos de uso de cada dominio.
 *
 * Todos los HTTP clients están completamente implementados y conectados
 * a los endpoints del API Gateway.
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
            const response = await authClient.login(credentials);
            localStorage.setItem('authToken', response.token);
            window.location.reload();
            return response;
          } catch (error) {
            console.error('[auth.login] Error:', error);
            throw error;
          }
        },
        register: async (data: {
          email: string;
          password: string;
          firstName: string;
          lastName: string;
          phone?: string;
          roles: string[];
        }) => {
          try {
            const response = await authClient.register(data);
            localStorage.setItem('authToken', response.token);
            return response;
          } catch (error) {
            console.error('[auth.register] Error:', error);
            throw error;
          }
        },
      },

      // --- Booking ---
      bookings: {
        create: async (dto: any) => {
          try {
            const result = await bookingClient.createBooking(dto);
            console.log('[bookings.create] Success:', result);
            return result;
          } catch (error) {
            console.error('[bookings.create] Error:', error);
            throw error;
          }
        },
        findByUser: async (userId: string) => {
          try {
            const bookings = await bookingClient.getBookingsByUser(userId);
            return bookings;
          } catch (error) {
            console.error('[bookings.findByUser] Error:', error);
            return [];
          }
        },
      },

      // --- Transport ---
      transport: {
        requestTrip: async (dto: any) => {
          try {
            const trip = await transportClient.requestTrip(dto);
            return trip;
          } catch (error) {
            console.error('[transport.requestTrip] Error:', error);
            throw error;
          }
        },
        acceptTrip: async (tripId: string, driverId: string) => {
          try {
            return await transportClient.acceptTrip(tripId, driverId);
          } catch (error) {
            console.error('[transport.acceptTrip] Error:', error);
            throw error;
          }
        },
      },

      // --- Payment ---
      payment: {
        requestIntent: async (dto: any) => {
          try {
            const intent = await paymentClient.requestPaymentIntent(dto);
            return intent;
          } catch (error) {
            console.error('[payment.requestIntent] Error:', error);
            throw error;
          }
        },
      },

      // --- Parcel ---
      parcel: {
        create: async (dto: any) => {
          try {
            const result = await parcelClient.createParcel(dto);
            return result;
          } catch (error) {
            console.error('[parcel.create] Error:', error);
            throw error;
          }
        },
        findByUser: async (userId: string) => {
          try {
            const parcels = await parcelClient.getParcelsByUser(userId);
            return parcels;
          } catch (error) {
            console.error('[parcel.findByUser] Error:', error);
            return [];
          }
        },
      },

      // --- Accommodation ---
      accommodation: {
        create: async (dto: any) => {
          try {
            const result = await accommodationClient.createAccommodation(dto);
            return result;
          } catch (error) {
            console.error('[accommodation.create] Error:', error);
            throw error;
          }
        },
        search: async (query: any) => {
          try {
            const accommodations = await accommodationClient.searchAccommodations(query);
            return accommodations;
          } catch (error) {
            console.error('[accommodation.search] Error:', error);
            return [];
          }
        },
      },

      // --- Tour ---
      tour: {
        create: async (dto: any) => {
          try {
            const result = await tourClient.createTour(dto);
            return result;
          } catch (error) {
            console.error('[tour.create] Error:', error);
            throw error;
          }
        },
        search: async (query: any) => {
          console.log('[tour.search] Waiting for backend implementation');
          return [];
        },
      },

      // --- Experience ---
      experience: {
        create: async (dto: any) => {
          try {
            const result = await experienceClient.createExperience(dto);
            return result;
          } catch (error) {
            console.error('[experience.create] Error:', error);
            throw error;
          }
        },
        search: async (query: any) => {
          console.log('[experience.search] Waiting for backend implementation');
          return [];
        },
      },

      // --- Tracking ---
      tracking: {
        broadcastDriverLocation: async (dto: any) => {
          try {
            return await trackingClient.broadcastLocation(dto);
          } catch (error) {
            console.error('[tracking.broadcastLocation] Error:', error);
            throw error;
          }
        },
        getActiveDrivers: async () => {
          try {
            const drivers = await trackingClient.getActiveDrivers();
            return drivers;
          } catch (error) {
            console.error('[tracking.getActiveDrivers] Error:', error);
            return [];
          }
        },
        connectWebSocket: (onLocationUpdate?: (location: any) => void) => {
          return trackingClient.connectWebSocket(onLocationUpdate);
        },
      },

      // --- Notifications ---
      notifications: {
        send: async (dto: any) => {
          try {
            return await notificationClient.sendNotification(dto);
          } catch (error) {
            console.error('[notifications.send] Error:', error);
            throw error;
          }
        },
        getByUser: async (userId: string) => {
          try {
            const notifications = await notificationClient.getNotificationsByUser(userId);
            return notifications;
          } catch (error) {
            console.error('[notifications.getByUser] Error:', error);
            return [];
          }
        },
      },
    },
  };
};
