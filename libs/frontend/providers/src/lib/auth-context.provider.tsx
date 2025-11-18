import {
  // Puertos de Core (User Auth)
  IAuthRepository,
} from '@going-monorepo-clean/domains-user-frontend-core';
import {
  // Puertos de Core (Booking)
  IBookingRepository,
} from '@going-monorepo-clean/domains-booking-frontend-core';
import {
  // Puertos de Core (Transport)
  ITripRepository,
} from '@going-monorepo-clean/domains-transport-frontend-core';
import {
  // Puertos de Core (Payment)
  IPaymentGateway,
} from '@going-monorepo-clean/domains-payment-frontend-core';
import {
  // Puertos de Core (Parcel)
  IParcelRepository,
} from '@going-monorepo-clean/domains-parcel-frontend-core';
import {
  // Puertos de Core (Accommodation)
  IAccommodationRepository,
} from '@going-monorepo-clean/domains-accommodation-frontend-core';
import {
  // Puertos de Core (Tour)
  ITourRepository,
} from '@going-monorepo-clean/domains-tour-frontend-core';
import {
  // Puertos de Core (Tracking)
  ITrackingGateway,
  IDriverLocationRepository,
  IUserLocationGateway,
} from '@going-monorepo-clean/domains-tracking-frontend-core';
import {
  // Puertos de Core (Notification)
  INotificationRepository,
} from '@going-monorepo-clean/domains-notification-frontend-core';


// --- Casos de Uso (Application) ---
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
  FindParcelsByUserUseCase,
} from '@going-monorepo-clean/domains-parcel-frontend-application';
import {
  SearchAccommodationsUseCase,
} from '@going-monorepo-clean/domains-accommodation-frontend-application';
import {
  SearchToursUseCase,
} from '@going-monorepo-clean/domains-tour-frontend-application';
import {
  BroadcastDriverLocationUseCase,
  GetActiveDriversUseCase,
} from '@going-monorepo-clean/domains-tracking-frontend-application';
import {
  GetUserNotificationsUseCase,
} from '@going-monorepo-clean/domains-notification-frontend-application';


// --- Infraestructura (Adaptadores HTTP/Storage) ---
import { HttpAuthRepository } from '@going-monorepo-clean/domains-user-frontend-infrastructure';
import { HttpBookingRepository } from '@going-monorepo-clean/domains-booking-frontend-infrastructure';
import { HttpTripRepository } from '@going-monorepo-clean/domains-transport-frontend-infrastructure';
import { HttpPaymentGateway } from '@going-monorepo-clean/domains-payment-frontend-infrastructure';
import { HttpParcelRepository } from '@going-monorepo-clean/domains-parcel-frontend-infrastructure';
import { HttpAccommodationRepository } from '@going-monorepo-clean/domains-accommodation-frontend-infrastructure';
import { HttpTourRepository } from '@going-monorepo-clean/domains-tour-frontend-infrastructure';
import { HttpNotificationRepository } from '@going-monorepo-clean/domains-notification-frontend-infrastructure';
import { SocketTrackingGateway, HttpLocationRepository } from '@going-monorepo-clean/domains-tracking-frontend-infrastructure';


/**
 * CONTEINEDOR DE INYECCIÓN DE DEPENDENCIAS (MANUAL)
 * Construye todos los Adaptadores y los inyecta en los Casos de Uso.
 */
class DependencyProvider {
  // --- Repositorios (Adaptadores) ---
  public readonly authRepository: IAuthRepository;
  public readonly bookingRepository: IBookingRepository;
  public readonly tripRepository: ITripRepository;
  public readonly paymentGateway: IPaymentGateway;
  public readonly parcelRepository: IParcelRepository;
  public readonly accommodationRepository: IAccommodationRepository;
  public readonly tourRepository: ITourRepository;
  public readonly notificationRepository: INotificationRepository;
  public readonly driverLocationRepository: IDriverLocationRepository;
  public readonly userLocationGateway: IUserLocationGateway;


  // --- Casos de Uso (Application) ---
  public readonly loginUseCase: LoginUseCase;
  public readonly loadSessionUseCase: LoadSessionUseCase;
  public readonly createBookingUseCase: CreateBookingUseCase;
  public readonly findUserBookingsUseCase: FindUserBookingsUseCase;
  public readonly requestTripUseCase: RequestTripUseCase;
  public readonly getActiveTripUseCase: GetActiveTripUseCase;
  public readonly requestPaymentIntentUseCase: RequestPaymentIntentUseCase;
  public readonly createParcelUseCase: CreateParcelUseCase;
  public readonly findParcelsByUserUseCase: FindParcelsByUserUseCase;
  public readonly searchAccommodationsUseCase: SearchAccommodationsUseCase;
  public readonly searchToursUseCase: SearchToursUseCase;
  public readonly broadcastDriverLocationUseCase: BroadcastDriverLocationUseCase;
  public readonly getActiveDriversUseCase: GetActiveDriversUseCase;
  public readonly getUserNotificationsUseCase: GetUserNotificationsUseCase;
  

  constructor() {
    // 1. Instanciar Adaptadores de Infraestructura (Implementaciones HTTP/Storage)
    this.authRepository = new HttpAuthRepository();
    this.bookingRepository = new HttpBookingRepository();
    this.tripRepository = new HttpTripRepository();
    this.paymentGateway = new HttpPaymentGateway();
    this.parcelRepository = new HttpParcelRepository();
    this.accommodationRepository = new HttpAccommodationRepository();
    this.tourRepository = new HttpTourRepository();
    this.notificationRepository = new HttpNotificationRepository();
    this.driverLocationRepository = new HttpLocationRepository();
    this.userLocationGateway = new SocketTrackingGateway(this.authRepository); // Socket necesita saber si hay token

    // 2. Inyectar dependencias en los Casos de Uso

    // User/Auth
    this.loginUseCase = new LoginUseCase(this.authRepository);
    this.loadSessionUseCase = new LoadSessionUseCase(this.authRepository);

    // Booking (necesita token de Auth)
    this.createBookingUseCase = new CreateBookingUseCase(this.bookingRepository, this.authRepository);
    this.findUserBookingsUseCase = new FindUserBookingsUseCase(this.bookingRepository, this.authRepository);
    
    // Transport (necesita token de Auth)
    this.requestTripUseCase = new RequestTripUseCase(this.tripRepository, this.authRepository);
    this.getActiveTripUseCase = new GetActiveTripUseCase(this.tripRepository, this.authRepository);

    // Payment (necesita token de Auth)
    this.requestPaymentIntentUseCase = new RequestPaymentIntentUseCase(this.paymentGateway, this.authRepository);
    
    // Parcel (necesita token de Auth)
    this.createParcelUseCase = new CreateParcelUseCase(this.parcelRepository, this.authRepository);
    this.findParcelsByUserUseCase = new FindParcelsByUserUseCase(this.parcelRepository, this.authRepository);
    
    // Search (Accommodation/Tour)
    this.searchAccommodationsUseCase = new SearchAccommodationsUseCase(this.accommodationRepository);
    this.searchToursUseCase = new SearchToursUseCase(this.tourRepository);
    
    // Tracking (Broadcast usa el repositorio del driver)
    this.broadcastDriverLocationUseCase = new BroadcastDriverLocationUseCase(this.driverLocationRepository, this.authRepository);
    this.getActiveDriversUseCase = new GetActiveDriversUseCase(this.driverLocationRepository);
    
    // Notifications (necesita token de Auth)
    this.getUserNotificationsUseCase = new GetUserNotificationsUseCase(this.notificationRepository, this.authRepository);

  }
}

// Exporta una única instancia (Singleton) para que toda la app use la misma
export const dependencyProvider = new DependencyProvider();