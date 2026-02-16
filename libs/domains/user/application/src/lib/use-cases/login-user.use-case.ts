import { Inject, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import {
  IUserRepository,
  IPasswordHasher,
  ITokenService,
} from '@going-monorepo-clean/domains-user-core'; // Reemplaza con tu scope
import { LoginUserDto } from '../dto/login-user.dto';

export type LoginResponseDto = {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    roles: string[];
  };
};

@Injectable()
export class LoginUserUseCase {
  constructor(
    @Inject(IUserRepository)
    private readonly userRepo: IUserRepository,
    @Inject(IPasswordHasher)
    private readonly passwordHasher: IPasswordHasher,
    @Inject(ITokenService)
    private readonly tokenService: ITokenService,
  ) {}

  async execute(dto: LoginUserDto): Promise<LoginResponseDto> {
    // 1. Encontrar al usuario por email
    const userResult = await this.userRepo.findByEmail(dto.email);
    if (userResult.isErr()) {
      throw new InternalServerErrorException(userResult.error.message);
    }
    const user = userResult.value;
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 2. Verificar estado (ej. si está activo)
    if (user.status !== 'active') {
      throw new UnauthorizedException('Account is not active');
    }

    // 3. Comparar la contraseña (usando el "Puerto")
    const isPasswordValid = await user.checkPassword(dto.password, this.passwordHasher);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const roles = user.roles.map(r => r.toPrimitives());
    const token = this.tokenService.generateAuthToken(user.id, user.email, roles);
    const refreshToken = this.tokenService.generateRefreshToken(user.id);

    return {
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        roles: roles,
      },
    };
  }
}