import {
  User,
  IUserRepository,
  IPasswordHasher,
} from '@going-monorepo-clean/domains-user-core';
import { Result, ok, err } from 'neverthrow';

export interface LoginUserDto {
  email: string;
  password: string;
}

export class LoginUserUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly hasher: IPasswordHasher
  ) {}

  async execute(dto: LoginUserDto): Promise<Result<User, Error>> {
    const userResult = await this.userRepo.findByEmail(dto.email);

    if (userResult.isErr() || !userResult.value) {
      return err(new Error('Invalid credentials'));
    }

    const user = userResult.value;

    const isPasswordValid = await this.hasher.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      return err(new Error('Invalid credentials'));
    }

    return ok(user);
  }
}