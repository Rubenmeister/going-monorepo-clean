import { dependencyProvider } from './dependency-provider';
import { useAuth } from './auth-context.provider'; // Usamos el hook de Auth que creamos antes

/**
 * Hook central que expone todos los Casos de Uso del monorepo
 * de forma organizada por dominio.
 * * Este hook será usado por todas las aplicaciones de React/Next.js.
 */
export const useMonorepoApp = () => {
  const authState = useAuth(); // Incluye el estado global de autenticación

  return {
    // 1. ESTADO GLOBAL
    auth: authState,

    // 2. CASOS DE USO (Funciones de Dominio)
    domain: {
      // Autenticación (User Frontend)
      auth: {
        login: authState.login, // Usamos la función del contexto
        logout: authState.logout,
      },
      
      // Reservas (Booking Frontend)
      bookings: {
        create: dependencyProvider.createBookingUseCase.execute,
        findUser: dependencyProvider.findUserBookingsUseCase.execute,
      },
      
      // Transporte (Transport Frontend)
      transport: {
        requestTrip: dependencyProvider.requestTripUseCase.execute,
        getActiveTrip: dependencyProvider.getActiveTripUseCase.execute,
      },

      // Pagos (Payment Frontend)
      payment: {
        requestIntent: dependencyProvider.requestPaymentIntentUseCase.execute,
      },

      // Envíos (Parcel Frontend)
      parcels: {
        create: dependencyProvider.createParcelUseCase.execute,
        findUser: dependencyProvider.findParcelsByUserUseCase.execute,
      },

      // Búsquedas (Accommodation & Tour)
      search: {
        accommodations: dependencyProvider.searchAccommodationsUseCase.execute,
        tours: dependencyProvider.searchToursUseCase.execute,
      },

      // Notificaciones
      notifications: {
        findUser: dependencyProvider.getUserNotificationsUseCase.execute,
      },
      
      // Tracking (WebSockets)
      tracking: {
        broadcastDriverLocation: dependencyProvider.broadcastDriverLocationUseCase.execute,
        getActiveDrivers: dependencyProvider.getActiveDriversUseCase.execute,
        // Aquí se usaría el useUserLocationSocket hook para suscribirse
        socketGateway: dependencyProvider.userLocationGateway, 
      }
    },
  };
};