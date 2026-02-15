import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import {
  RegisterUserDto,
  RegisterUserUseCase,
  LoginUserDto,
  LoginUserUseCase,
} from '@going-monorepo-clean/domains-user-application';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUserUseCase: LoginUserUseCase,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Registrar un nuevo usuario' })
  @ApiBody({ type: RegisterUserDto })
  @ApiResponse({ status: 201, description: 'Usuario registrado exitosamente', schema: { properties: { id: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440000' } } } })
  @ApiResponse({ status: 409, description: 'Email ya está en uso' })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  async register(@Body() dto: RegisterUserDto): Promise<any> {
    return this.registerUserUseCase.execute(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiBody({ type: LoginUserDto })
  @ApiResponse({ status: 201, description: 'Login exitoso', schema: { properties: { token: { type: 'string' }, user: { type: 'object', properties: { id: { type: 'string' }, email: { type: 'string' }, firstName: { type: 'string' }, roles: { type: 'array', items: { type: 'string' } } } } } } })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas o cuenta inactiva' })
  async login(@Body() dto: LoginUserDto): Promise<any> {
    return this.loginUserUseCase.execute(dto);
  }
}
