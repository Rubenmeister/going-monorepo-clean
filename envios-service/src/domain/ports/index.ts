import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * JWT Auth Guard
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any) {
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
