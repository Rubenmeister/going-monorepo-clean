import { Controller, Post, Body, HttpCode, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import {
  RegisterUserDto,
  RegisterUserUseCase,
  LoginUserDto,
  LoginUserUseCase,
  RefreshTokenDto,
  RefreshTokenUseCase,
} from '@going-monorepo-clean/domains-user-application';
import { Public, AccountLockoutService } from '@going-monorepo-clean/shared-domain';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUserUseCase: LoginUserUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly lockoutService: AccountLockoutService,
  ) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Registrar un nuevo usuario' })
  @ApiBody({ type: RegisterUserDto })
  @ApiResponse({ status: 201, description: 'Usuario registrado exitosamente', schema: { properties: { id: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440000' } } } })
  @ApiResponse({ status: 409, description: 'Email ya está en uso' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  async register(@Body() dto: RegisterUserDto): Promise<any> {
    return this.registerUserUseCase.execute(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiBody({ type: LoginUserDto })
  @ApiResponse({ status: 200, description: 'Login exitoso', schema: { properties: { token: { type: 'string' }, refreshToken: { type: 'string' }, user: { type: 'object', properties: { id: { type: 'string' }, email: { type: 'string' }, firstName: { type: 'string' }, roles: { type: 'array', items: { type: 'string' } } } } } } })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas o cuenta inactiva' })
  @ApiResponse({ status: 423, description: 'Cuenta bloqueada temporalmente por intentos fallidos' })
  async login(@Body() dto: LoginUserDto): Promise<any> {
    if (this.lockoutService.isLocked(dto.email)) {
      const remaining = this.lockoutService.getRemainingLockTime(dto.email);
      throw new UnauthorizedException(
        `Account temporarily locked. Try again in ${remaining} seconds`,
      );
    }

    try {
      const result = await this.loginUserUseCase.execute(dto);
      this.lockoutService.resetAttempts(dto.email);
      return result;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        this.lockoutService.recordFailedAttempt(dto.email);
      }
      throw error;
    }
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar token de acceso usando refresh token' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({ status: 200, description: 'Tokens renovados exitosamente', schema: { properties: { token: { type: 'string' }, refreshToken: { type: 'string' } } } })
  @ApiResponse({ status: 401, description: 'Refresh token inválido o expirado' })
  async refresh(@Body() dto: RefreshTokenDto): Promise<any> {
    return this.refreshTokenUseCase.execute(dto);
  }
}
