import { Inject, Injectable } from '@nestjs/common';
import { Result, ok, err } from 'neverthrow';
import { IAuthRepository } from '@going-monorepo-clean/domains-user-frontend-core';
import { LoginDto } from '../dto/login.dto';

export interface AuthViewModel {
  token: string;
  userId: string;
  firstName: string;
  roles: string[];
}

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(IAuthRepository)
    private readonly authRepository: IAuthRepository,
  ) {}

  async execute(dto: LoginDto): Promise<Result<AuthViewModel, Error>> {
    const result = await this.authRepository.login(dto.email, dto.password);

    if (result.isErr()) {
      return err(result.error);
    }

    const session = result.value;
    const viewModel: AuthViewModel = {
      token: session.token,
      userId: session.userId,
      firstName: session.firstName,
      roles: session.roles,
    };

    return ok(viewModel);
  }
}
