import {
  IAuthRepository,
} from '@going-monorepo-clean/domains-user-frontend-core'; // Reemplaza con tu scope
import {
  LoginUseCase,
  LoadSessionUseCase,
} from '@going-monorepo-clean/domains-user-frontend-application';
import {
  HttpAuthRepository,
} from '@going-monorepo-clean/domains-user-frontend-infrastructure';

/**
 * Esta clase construye todas nuestras dependencias.
 * Implementa la inyección de dependencias manualmente.
 */
class DependencyProvider {
  // Guarda una única instancia de cada repositorio
  public readonly authRepository: IAuthRepository;

  // Guarda una única instancia de cada caso de uso
  public readonly loginUseCase: LoginUseCase;
  public readonly loadSessionUseCase: LoadSessionUseCase;

  constructor() {
    // 1. Crear el Adaptador de Infraestructura
    this.authRepository = new HttpAuthRepository();

    // 2. Inyectar el adaptador en los Casos de Uso
    this.loginUseCase = new LoginUseCase(this.authRepository);
    this.loadSessionUseCase = new LoadSessionUseCase(this.authRepository);
  }
}

// Exporta una única instancia (Singleton) para que toda la app use la misma
export const dependencyProvider = new DependencyProvider();