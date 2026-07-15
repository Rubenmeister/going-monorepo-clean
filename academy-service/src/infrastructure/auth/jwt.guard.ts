import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
  createParamDecorator,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

/**
 * Verifica un JWT aceptando HS256 (secreto compartido, actual) y RS256
 * (clave pública, futuro) — auditoría #13. Servicio standalone: replica la
 * lógica dual sin importar la lib del monorepo (mismo patrón que
 * social-service / corporate-service).
 */
function dualVerifyJwt(token: string, hsSecret: string): jwt.JwtPayload | string {
  const header = JSON.parse(
    Buffer.from(String(token).split('.')[0] ?? '', 'base64url').toString('utf8'),
  );
  if (header?.alg === 'RS256') {
    const pub = process.env.RS256_PUBLIC_KEY;
    if (!pub) throw new Error('Token RS256 pero RS256_PUBLIC_KEY no configurada');
    return jwt.verify(token, pub.replace(/\\n/g, '\n'), { algorithms: ['RS256'] });
  }
  return jwt.verify(token, hsSecret, { algorithms: ['HS256'] });
}

/**
 * JwtAuthGuard — valida el JWT contra JWT_SECRET (el mismo secret que firma
 * user-auth-service). Fail-closed si no hay secret. La identidad SIEMPRE sale
 * del token verificado (@CurrentUser), nunca del body/param del cliente.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const header = req.headers?.authorization || req.headers?.Authorization;
    if (!header || typeof header !== 'string' || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or malformed Authorization header');
    }
    const token = header.slice(7).trim();
    if (!token) throw new UnauthorizedException('Empty bearer token');

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      this.logger.error('JWT_SECRET no configurado — auth fail-closed');
      throw new UnauthorizedException('Auth misconfigured');
    }

    try {
      const decoded = dualVerifyJwt(token, secret) as Record<string, unknown>;
      const userId = (decoded.sub as string) || (decoded.userId as string);
      if (!userId) throw new Error('Token without sub/userId');
      const rolesRaw = decoded.roles ?? decoded.role;
      const roles = Array.isArray(rolesRaw)
        ? (rolesRaw as string[])
        : typeof rolesRaw === 'string'
          ? [rolesRaw]
          : [];
      req.user = {
        id: userId,
        email: (decoded.email as string) || '',
        roles,
        jti: (decoded.jti as string) || undefined,
        raw: decoded,
      };
      return true;
    } catch (err) {
      const msg = (err as Error).message || 'invalid token';
      throw new UnauthorizedException(`Invalid token: ${msg}`);
    }
  }
}

/**
 * AdminGuard — exige role 'admin'. Usar JUNTO con JwtAuthGuard.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const roles: string[] = req.user?.roles || [];
    if (!roles.includes('admin')) {
      throw new UnauthorizedException('Admin role required');
    }
    return true;
  }
}

/**
 * InternalServiceGuard — valida llamadas servicio-a-servicio (ej. transport-
 * service enriqueciendo el ranking de conductores con su nivel de Academia).
 * Acepta header `X-Internal-Token` === INTERNAL_SERVICE_TOKEN. Fail-closed.
 * El api-gateway BORRA este header en el borde público, así que solo llega por
 * VPC desde otros servicios.
 */
@Injectable()
export class InternalServiceGuard implements CanActivate {
  private readonly logger = new Logger(InternalServiceGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const provided = req.headers?.['x-internal-token'];
    const expected = process.env.INTERNAL_SERVICE_TOKEN;
    if (!expected) {
      this.logger.error('INTERNAL_SERVICE_TOKEN no configurado — auth fail-closed');
      throw new UnauthorizedException('Internal auth misconfigured');
    }
    if (provided !== expected) {
      throw new UnauthorizedException('Invalid or missing X-Internal-Token');
    }
    return true;
  }
}

/**
 * @CurrentUser() — inyecta req.user en el handler.
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user;
    if (!user) return null;
    return data ? user[data] : user;
  },
);

export type AuthUser = {
  id: string;
  email: string;
  roles: string[];
  jti?: string;
  raw: Record<string, unknown>;
};
