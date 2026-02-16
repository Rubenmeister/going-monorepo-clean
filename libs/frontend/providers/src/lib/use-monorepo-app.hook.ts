import { dependencyProvider } from './auth-context.provider';

// Stub auth state - will be replaced with real auth state management in Phase 3
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
    logout: () => { /* TODO: implement in Phase 3 */ },
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
      },
      notification: {
        getByUser: dependencyProvider.getUserNotificationsUseCase,
      },
      search: {
        accommodations: dependencyProvider.searchAccommodationsUseCase,
        tours: dependencyProvider.searchToursUseCase,
      },
    },
  };
};
