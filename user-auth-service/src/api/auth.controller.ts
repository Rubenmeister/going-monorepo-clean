import { Controller, Post, Body, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { 
  RegisterUserUseCase, 
  LoginUserUseCase,
  RegisterUserDto,
  LoginUserDto,
  AuthResponseDto
} from '@going-monorepo-clean/domains-user-application';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUserUseCase: LoginUserUseCase,
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterUserDto): Promise<AuthResponseDto> {
    const result = await this.registerUserUseCase.execute(dto);

    if (result.isErr()) {
      throw new BadRequestException(result.error.message);
    }

    const user = result.value.toPrimitives();
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      accessToken: 'mock-jwt-token-for-now',
    };
  }

  @Post('login')
  async login(@Body() dto: LoginUserDto): Promise<AuthResponseDto> {
    const result = await this.loginUserUseCase.execute(dto);

    if (result.isErr()) {
      throw new UnauthorizedException(result.error.message);
    }

    const user = result.value.toPrimitives();
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      accessToken: 'mock-jwt-token-for-now',
    };
  }
}