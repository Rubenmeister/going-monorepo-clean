import { Inject, Injectable } from '@nestjs/common';
import { Result } from 'neverthrow';
import {
  IAuthRepository,
  AuthResponse,
} from '@going-monorepo-clean/domains-user-frontend-core'; // Reemplaza con tu scope

@Injectable()
export class LoadSessionUseCase {
  constructor(
    @Inject(IAuthRepository)
    private readonly authRepository: IAuthRepository,
  ) {}

  public async execute(): Promise<Result<AuthResponse | null, Error>> {
    return this.authRepository.loadSession();
  }
}