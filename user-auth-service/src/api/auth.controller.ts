import { Controller, Post, Body } from '@nestjs/common';
import {
  RegisterUserDto,
  RegisterUserUseCase,
  LoginUserDto,
  LoginUserUseCase,
} from '@going-monorepo-clean/domains-user-application'; // Reemplaza con tu scope

@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUserUseCase: LoginUserUseCase,
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterUserDto): Promise<any> {
    return this.registerUserUseCase.execute(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginUserDto): Promise<any> {
    return this.loginUserUseCase.execute(dto);
  }
}