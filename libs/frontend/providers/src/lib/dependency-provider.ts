import {
  // Puertos de Core (User Auth)
  IAuthRepository,
} from '@going-monorepo-clean/domains-user-frontend-core';
// (Importaciones de todos los demás Puertos omitidas por brevedad)
// ...
import {
  IPaymentGateway, // <-- NUEVO: Puerto para Payment
} from '@going-monorepo-clean/domains-payment-frontend-core';

// (Importaciones de todos los Casos de Uso omitidas por brevedad)
// ...
import {
  RequestPaymentIntentUseCase, // <-- NUEVO: Caso de Uso de Payment
} from '@going-monorepo-clean/domains-payment-frontend-application';

// (Importaciones de todos los Adaptadores omitidas por brevedad)
// ...
import { HttpPaymentGateway } from '@going-monorepo-clean/domains-payment-frontend-infrastructure'; // <-- NUEVO: Adaptador HTTP

// ... (El resto de importaciones de Booking, Transport, Tracking, etc.) ...


class DependencyProvider {
  // --- Repositorios (Adaptadores) ---
  // ... (otros repositorios) ...
  public readonly paymentGateway: IPaymentGateway; // <-- Añadido

  // --- Casos de Uso (Application) ---
  // ... (otros casos de uso) ...
  public readonly requestPaymentIntentUseCase: RequestPaymentIntentUseCase; // <-- Añadido

  // ... (otros Casos de Uso) ...

  constructor() {
    // 1. Instanciar Adaptadores de Infraestructura
    // ... (otros repositorios) ...
    this.paymentGateway = new HttpPaymentGateway(); // <-- Añadido

    // 2. Inyectar dependencias en los Casos de Uso
    // ... (User, Booking, Transport, etc.) ...

    // Payment (necesita token de Auth)
    this.requestPaymentIntentUseCase = new RequestPaymentIntentUseCase(
      this.paymentGateway,
      this.authRepository
    );
  }
}

// Exporta una única instancia (Singleton) para toda la app
export const dependencyProvider = new DependencyProvider();