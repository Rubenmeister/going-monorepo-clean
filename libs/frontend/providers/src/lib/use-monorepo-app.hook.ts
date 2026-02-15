import { dependencyProvider } from './auth-context.provider';

export const useMonorepoApp = () => {
  return {
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
        broadcastLocation: dependencyProvider.broadcastDriverLocationUseCase,
      },
      notification: {
        getByUser: dependencyProvider.getUserNotificationsUseCase,
      },
    },
  };
};
