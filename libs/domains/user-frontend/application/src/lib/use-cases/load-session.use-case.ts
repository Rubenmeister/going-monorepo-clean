import { Inject, Injectable } from '@nestjs/common';
import { Result, ok, err } from 'neverthrow';
import { IAuthRepository } from '@going-monorepo-clean/domains-user-frontend-core';
import { AuthViewModel } from './login.use-case';

@Injectable()
export class LoadSessionUseCase {
  constructor(
    @Inject(IAuthRepository)
    private readonly authRepository: IAuthRepository,
  ) {}

  public async execute(): Promise<Result<AuthViewModel | null, Error>> {
    const sessionResult = await this.authRepository.loadSession();

    if (sessionResult.isErr()) {
      return err(sessionResult.error);
    }

    const session = sessionResult.value;
    if (!session) return ok(null);

    return ok({
      token: session.token,
      userId: session.userId,
      firstName: session.firstName,
      roles: session.roles,
    });
  }
}
