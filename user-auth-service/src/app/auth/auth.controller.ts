import { Controller, Post, Get, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: any) {
    return this.authService.register(body);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK) // Para devolver código 200 en vez de 201
  async login(@Body() body: any) {
    return this.authService.login(body);
  }

  @Get('users')
  async getUsers() {
    return this.authService.findAll();
  }
}