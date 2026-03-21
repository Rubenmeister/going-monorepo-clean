import { All, Controller } from '@nestjs/common';

/**
 * AuthProxyController
 *
 * Este controlador existe SOLO para que Fastify registre las rutas /auth y /auth/*.
 * En NestJS+Fastify, el middleware del MiddlewareConsumer solo se ejecuta si existe
 * una ruta registrada en el router. Sin este controlador, Fastify retorna 404 antes
 * de llegar al middleware de proxy.
 *
 * Los métodos NUNCA se ejecutan en la práctica: el middleware proxy de ProxyModule
 * envía la respuesta y no llama a next(), por lo que el controlador no llega a correr.
 */
@Controller('auth')
export class AuthProxyController {
  @All()
  handleAuth() {
    // Nunca se ejecuta - el proxy middleware maneja la respuesta
  }

  @All('*')
  handleAuthWildcard() {
    // Nunca se ejecuta - el proxy middleware maneja la respuesta
  }
}
