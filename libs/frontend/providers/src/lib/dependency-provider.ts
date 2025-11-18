import {
  IAuthRepository,
} from '@going-monorepo-clean/domains-user-frontend-core';
import {
  IBookingRepository,
} from '@going-monorepo-clean/domains-booking-frontend-core';
import {
  ITripRepository,
} from '@going-monorepo-clean/domains-transport-frontend-core'; // <--- NUEVO

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
  GetActiveTripUseCase, // Asumiendo que creaste este caso de uso
} from '@going-monorepo-clean/domains-transport-frontend-application'; // <--- NUEVO

import {
  HttpAuthRepository,
} from '@going-monorepo-clean/domains-user-frontend-infrastructure';
import {
  HttpBookingRepository,
} from '@going-monorepo-clean/domains-booking-frontend-infrastructure';
import {
  HttpTripRepository,
} from '@going-monorepo-clean/domains-transport-frontend-infrastructure'; // <--- NUEVO

class DependencyProvider {
  // --- Repositorios ---
  public readonly authRepository: IAuthRepository;
  public readonly bookingRepository: IBookingRepository;
  public readonly tripRepository: ITripRepository; // <--- NUEVO

  // --- Casos de Uso: User ---
  public readonly loginUseCase: LoginUseCase;
  public readonly loadSessionUseCase: LoadSessionUseCase;

  // --- Casos de Uso: Booking ---
  public readonly createBookingUseCase: CreateBookingUseCase;
  public readonly findUserBookingsUseCase: FindUserBookingsUseCase;

  // --- Casos de Uso: Transport ---
  public readonly requestTripUseCase: RequestTripUseCase; // <--- NUEVO
  public readonly getActiveTripUseCase: GetActiveTripUseCase; // <--- NUEVO

  constructor() {
    // 1. Instanciar Adaptadores
    this.authRepository = new HttpAuthRepository();
    this.bookingRepository = new HttpBookingRepository();
    this.tripRepository = new HttpTripRepository(); // <--- NUEVO

    // 2. Inyectar en User
    this.loginUseCase = new LoginUseCase(this.authRepository);
    this.loadSessionUseCase = new LoadSessionUseCase(this.authRepository);

    // 3. Inyectar en Booking
    this.createBookingUseCase = new CreateBookingUseCase(
      this.bookingRepository,
      this.authRepository
    );
    this.findUserBookingsUseCase = new FindUserBookingsUseCase(
      this.bookingRepository,
      this.authRepository
    );

    // 4. Inyectar en Transport
    this.requestTripUseCase = new RequestTripUseCase(
      this.tripRepository,
      this.authRepository
    );
    this.getActiveTripUseCase = new GetActiveTripUseCase(
      this.tripRepository,
      this.authRepository
    );
  }
}

export const dependencyProvider = new DependencyProvider();