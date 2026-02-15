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
} from '@going-monorepo-clean/domains-tracking-frontend-application';
import {
  GetUserNotificationsUseCase,
} from '@going-monorepo-clean/domains-notification-frontend-application';

/**
 * Contenedor de Casos de Uso.
 * Con la nueva arquitectura, los use cases instancian sus propios API clients internamente.
 * Ya no se necesita inyección de dependencias manual.
 */
class DependencyProvider {
  public readonly loginUseCase: LoginUseCase;
  public readonly loadSessionUseCase: LoadSessionUseCase;
  public readonly createBookingUseCase: CreateBookingUseCase;
  public readonly findUserBookingsUseCase: FindUserBookingsUseCase;
  public readonly requestTripUseCase: RequestTripUseCase;
  public readonly getActiveTripUseCase: GetActiveTripUseCase;
  public readonly requestPaymentIntentUseCase: RequestPaymentIntentUseCase;
  public readonly createParcelUseCase: CreateParcelUseCase;
  public readonly searchAccommodationsUseCase: SearchAccommodationsUseCase;
  public readonly searchToursUseCase: SearchToursUseCase;
  public readonly broadcastDriverLocationUseCase: BroadcastDriverLocationUseCase;
  public readonly getUserNotificationsUseCase: GetUserNotificationsUseCase;

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
    this.getUserNotificationsUseCase = new GetUserNotificationsUseCase();
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
