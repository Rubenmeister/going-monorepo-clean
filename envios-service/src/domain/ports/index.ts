import { Injectable, SetMetadata, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * @Public decorator — marks routes that don't require JWT auth
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/**
 * JWT Auth Guard.
 *
 * Antes: `if (!user) return null;` dejaba pasar peticiones sin token válido
 * con req.user = null, y el controlador crasheaba al leer `user.id`.
 * Ahora rechaza explícitamente con 401, excepto en rutas marcadas @Public.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector = new Reflector()) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }

  handleRequest<TUser = any>(err: any, user: TUser, info: any): TUser {
    if (err) throw err;
    if (!user) {
      throw new UnauthorizedException(
        info?.message ?? 'Token inválido o ausente',
      );
    }
    return user;
  }
}

/**
 * @CurrentUser decorator — extracts the JWT payload from request.user
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    if (!user) return null;
    if (data) return user[data];
    return user;
  }
);
