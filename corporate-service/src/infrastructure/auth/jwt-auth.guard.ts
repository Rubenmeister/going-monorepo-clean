import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JwtAuthGuard fail-closed: sin token válido → 401. Verifica la firma vía
 * passport-jwt (JwtStrategy) y deja el payload validado en req.user.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any) {
    if (err) throw err;
    if (!user) {
      throw new UnauthorizedException(info?.message ?? 'Token inválido o ausente');
    }
    return user;
  }
}
