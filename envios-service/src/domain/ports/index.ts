import { Injectable, SetMetadata } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * @Public decorator — marks routes that don't require JWT auth
 */
export const Public = () => SetMetadata('isPublic', true);

/**
 * JWT Auth Guard
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const isPublic = context.getHandler().getMetadata?.('isPublic') || false;
    if (isPublic) return null; // Allow unauthenticated access to public routes
    if (err) throw err;
    if (!user) return null;
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
