import { All, Controller, Get, Post } from '@nestjs/common';

/**
 * AuthProxyController
 *
 * Registra explícitamente cada ruta /auth/* para que Fastify 5 + NestJS 11
 * ejecute el middleware proxy ANTES de llegar a estos handlers.
 * Los métodos NUNCA se ejecutan: el middleware proxy intercepta y responde.
 */
@Controller('auth')
export class AuthProxyController {
  // POST routes
  @Post('register') register() {}
  @Post('login') login() {}
  @Post('logout') logout() {}
  @Post('refresh') refresh() {}
  @Post('google/callback') googleCallback() {}
  @Post('facebook/callback') facebookCallback() {}
  @Post('corporate/login') corporateLogin() {}
  @Post('unlock/:userId') unlock() {}
  @Post('admin/unlock/:userId') adminUnlock() {}

  // GET routes
  @Get('me') me() {}
  @Get('google') google() {}
  @Get('facebook') facebook() {}
  @Get('lockout/:userId') lockoutStats() {}
  @Get('health') health() {}

  // Fallback for any other /auth sub-route (NestJS 11 + Fastify 5 compatible)
  @All() root() {}
}
