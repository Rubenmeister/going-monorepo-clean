import { dependencyProvider } from './auth-context.provider';

// Auth state types
interface AuthUser {
  id: string;
  firstName: string;
  roles: string[];
  isAdmin(): boolean;
  isDriver(): boolean;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  logout: () => void;
}

export const useMonorepoApp = () => {
  // Placeholder auth state (Phase 1: compile only)
  const auth: AuthState = {
    user: null,
    isLoading: false,
    error: null,
    logout: () => { /* TODO: implement with real token clearing */ },
  };

  return {
    auth,
    domain: {
      auth: {
        login: dependencyProvider.loginUseCase,
        loadSession: dependencyProvider.loadSessionUseCase,
      },
      booking: {
        create: dependencyProvider.createBookingUseCase,
        findByUser: dependencyProvider.findUserBookingsUseCase,
      },
      transport: {
        requestTrip: dependencyProvider.requestTripUseCase,
        getActiveTrip: dependencyProvider.getActiveTripUseCase,
      },
      payment: {
        requestIntent: dependencyProvider.requestPaymentIntentUseCase,
      },
      parcel: {
        create: dependencyProvider.createParcelUseCase,
      },
      accommodation: {
        search: dependencyProvider.searchAccommodationsUseCase,
      },
      tour: {
        search: dependencyProvider.searchToursUseCase,
      },
      tracking: {
        broadcastDriverLocation: dependencyProvider.broadcastDriverLocationUseCase,
        trackDriverForTrip: dependencyProvider.trackDriverForTripUseCase,
        calculateEta: dependencyProvider.calculateEtaUseCase,
        getTripRoute: dependencyProvider.getTripRouteUseCase,
      },
      notification: {
        getByUser: dependencyProvider.getUserNotificationsUseCase,
        markAsRead: dependencyProvider.markNotificationReadUseCase,
      },
      chat: {
        send: dependencyProvider.sendChatMessageUseCase,
        getTripChat: dependencyProvider.getTripChatUseCase,
      },
      search: {
        accommodations: dependencyProvider.searchAccommodationsUseCase,
        tours: dependencyProvider.searchToursUseCase,
      },
    },
  };
};
