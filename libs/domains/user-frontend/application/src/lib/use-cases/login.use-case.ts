import { Inject, Injectable } from '@nestjs/common';
import { Result } from 'neverthrow';
import {
  IAuthRepository,
  AuthResponse,
  LoginCredentials,
} from '@going-monorepo-clean/domains-user-frontend-core'; // Reemplaza 'going-monorepo-clean' con el scope de tu monorepo

@Injectable()
export class LoginUseCase {
  constructor(
    // 1. Inyecta el "Puerto" del core
    @Inject(IAuthRepository)
    private readonly authRepository: IAuthRepository,
  ) {}

  /**
   * Ejecuta el caso de uso de login.
   * Su trabajo es llamar al repositorio (que hará la llamada HTTP)
   * y devolver el resultado.
   */
  public async execute(
    credentials: LoginCredentials,
  ): Promise<Result<AuthResponse, Error>> {
    // 2. Llama al método del puerto
    return this.authRepository.login(credentials);
  }
}