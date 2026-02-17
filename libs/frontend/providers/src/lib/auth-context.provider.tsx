'use client';

import React, { createContext, useContext } from 'react';
import {
  LoginUseCase,
  LoadSessionUseCase,
} from '@going-monorepo-clean/domains-user-frontend-application';
import {
  CreateBookingUseCase,
  FindUserBookingsUseCase,
} from '@going-monorepo-clean/domains-booking-frontend-application';
import {
  RequestTripUseCase,
  GetActiveTripUseCase,
} from '@going-monorepo-clean/domains-transport-frontend-application';
import {
  RequestPaymentIntentUseCase,
} from '@going-monorepo-clean/domains-payment-frontend-application';
import {
  CreateParcelUseCase,
} from '@going-monorepo-clean/domains-parcel-frontend-application';
import {
  SearchAccommodationsUseCase,
} from '@going-monorepo-clean/domains-accommodation-frontend-application';
import {
  SearchToursUseCase,
} from '@going-monorepo-clean/domains-tour-frontend-application';
import {
  BroadcastDriverLocationUseCase,
  TrackDriverForTripUseCase,
  CalculateEtaUseCase,
  GetTripRouteUseCase,
} from '@going-monorepo-clean/domains-tracking-frontend-application';
import {
  GetUserNotificationsUseCase,
  MarkNotificationReadUseCase,
  SendChatMessageUseCase,
  GetTripChatUseCase,
} from '@going-monorepo-clean/domains-notification-frontend-application';

/**
 * Contenedor de Casos de Uso.
 * Los use cases instancian sus propios API clients internamente.
 */
class DependencyProvider {
  // Auth
  public readonly loginUseCase: LoginUseCase;
  public readonly loadSessionUseCase: LoadSessionUseCase;
  // Booking
  public readonly createBookingUseCase: CreateBookingUseCase;
  public readonly findUserBookingsUseCase: FindUserBookingsUseCase;
  // Transport
  public readonly requestTripUseCase: RequestTripUseCase;
  public readonly getActiveTripUseCase: GetActiveTripUseCase;
  // Payment
  public readonly requestPaymentIntentUseCase: RequestPaymentIntentUseCase;
  // Parcel
  public readonly createParcelUseCase: CreateParcelUseCase;
  // Search
  public readonly searchAccommodationsUseCase: SearchAccommodationsUseCase;
  public readonly searchToursUseCase: SearchToursUseCase;
  // Tracking & Geolocation
  public readonly broadcastDriverLocationUseCase: BroadcastDriverLocationUseCase;
  public readonly trackDriverForTripUseCase: TrackDriverForTripUseCase;
  public readonly calculateEtaUseCase: CalculateEtaUseCase;
  public readonly getTripRouteUseCase: GetTripRouteUseCase;
  // Notifications
  public readonly getUserNotificationsUseCase: GetUserNotificationsUseCase;
  public readonly markNotificationReadUseCase: MarkNotificationReadUseCase;
  // Chat
  public readonly sendChatMessageUseCase: SendChatMessageUseCase;
  public readonly getTripChatUseCase: GetTripChatUseCase;

  constructor() {
    this.loginUseCase = new LoginUseCase();
    this.loadSessionUseCase = new LoadSessionUseCase();
    this.createBookingUseCase = new CreateBookingUseCase();
    this.findUserBookingsUseCase = new FindUserBookingsUseCase();
    this.requestTripUseCase = new RequestTripUseCase();
    this.getActiveTripUseCase = new GetActiveTripUseCase();
    this.requestPaymentIntentUseCase = new RequestPaymentIntentUseCase();
    this.createParcelUseCase = new CreateParcelUseCase();
    this.searchAccommodationsUseCase = new SearchAccommodationsUseCase();
    this.searchToursUseCase = new SearchToursUseCase();
    this.broadcastDriverLocationUseCase = new BroadcastDriverLocationUseCase();
    this.trackDriverForTripUseCase = new TrackDriverForTripUseCase();
    this.calculateEtaUseCase = new CalculateEtaUseCase();
    this.getTripRouteUseCase = new GetTripRouteUseCase();
    this.getUserNotificationsUseCase = new GetUserNotificationsUseCase();
    this.markNotificationReadUseCase = new MarkNotificationReadUseCase();
    this.sendChatMessageUseCase = new SendChatMessageUseCase();
    this.getTripChatUseCase = new GetTripChatUseCase();
  }
}

export const dependencyProvider = new DependencyProvider();

const AppContext = createContext<DependencyProvider>(dependencyProvider);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <AppContext.Provider value={dependencyProvider}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
