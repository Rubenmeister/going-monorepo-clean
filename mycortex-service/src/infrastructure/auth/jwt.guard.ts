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
 * lógica dual sin importar la lib del monorepo.
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
 * JWT Auth Guard — versión minimal sin passport.
 *
 * Customer-support-service no usa @nestjs/passport (heavyweight para lo
 * que necesitamos). Este guard valida JWT contra `JWT_SECRET` env var,
 * el MISMO secret que firma user-auth-service. Cualquier JWT válido del
 * monorepo pasa.
 *
 * Uso:
 *   @UseGuards(JwtAuthGuard)
 *   @Controller('foo')
 *   class FooController {
 *     @Get('bar')
 *     bar(@CurrentUser() user: AuthUser) { ... }
 *   }
 *
 * Headers requeridos:
 *   Authorization: Bearer <jwt>
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
      // Fail closed: si no hay secret configurado, todo se rechaza.
      this.logger.error('JWT_SECRET no configurado — auth fail-closed');
      throw new UnauthorizedException('Auth misconfigured');
    }

    try {
      const decoded = dualVerifyJwt(token, secret) as Record<string, unknown>;
      // Normalizamos: aceptamos `sub` o `userId`, `role` (string) o `roles` (array).
      const userId = (decoded.sub as string) || (decoded.userId as string);
      if (!userId) throw new Error('Token without sub/userId');
      const rolesRaw = decoded.roles ?? decoded.role;
      const roles = Array.isArray(rolesRaw)
        ? (rolesRaw as string[])
        : typeof rolesRaw === 'string'
          ? [rolesRaw]
          : [];
      req.user = {
        id:    userId,
        email: (decoded.email as string) || '',
        roles,
        jti:   (decoded.jti as string) || undefined,
        raw:   decoded,
      };
      return true;
    } catch (err) {
      const msg = (err as Error).message || 'invalid token';
      throw new UnauthorizedException(`Invalid token: ${msg}`);
    }
  }
}

/**
 * AdminGuard — exige que el JWT tenga role 'admin'.
 * Usar JUNTO con JwtAuthGuard: @UseGuards(JwtAuthGuard, AdminGuard)
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
 * InternalServiceGuard — valida llamadas service-to-service.
 *
 * Acepta header `X-Internal-Token` con valor === INTERNAL_SERVICE_TOKEN env var.
 * Usado por command.controller (recibe POST /support/command del orchestrator).
 *
 * No usa JWT porque el orchestrator no actúa "como un usuario", actúa como
 * un service interno. Token-shared-secret es lo apropiado.
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
 * AdminOrInternalGuard — acepta dos métodos de auth:
 *   1. JWT con role 'admin' (admin-dashboard humano)
 *   2. X-Internal-Token header (cerebro-service S2S)
 *
 * Para endpoints que son consumidos tanto por humanos admin como por
 * servicios internos. Si alguno de los dos métodos pasa, accede.
 */
@Injectable()
export class AdminOrInternalGuard implements CanActivate {
  private readonly logger = new Logger(AdminOrInternalGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();

    // Path 1: X-Internal-Token válido
    const internal = req.headers?.['x-internal-token'];
    const internalExpected = process.env.INTERNAL_SERVICE_TOKEN;
    if (internalExpected && internal === internalExpected) {
      req.user = { id: 'internal-service', email: '', roles: ['internal'], raw: {} };
      return true;
    }

    // Path 2: JWT con admin role
    const header = req.headers?.authorization || req.headers?.Authorization;
    if (header && typeof header === 'string' && header.startsWith('Bearer ')) {
      const token = header.slice(7).trim();
      const secret = process.env.JWT_SECRET;
      if (secret && token) {
        try {
          const decoded = dualVerifyJwt(token, secret) as Record<string, unknown>;
          const rolesRaw = decoded.roles ?? decoded.role;
          const roles = Array.isArray(rolesRaw)
            ? (rolesRaw as string[])
            : typeof rolesRaw === 'string'
              ? [rolesRaw]
              : [];
          if (roles.includes('admin')) {
            req.user = {
              id:    (decoded.sub as string) || (decoded.userId as string) || '',
              email: (decoded.email as string) || '',
              roles,
              jti:   (decoded.jti as string) || undefined,
              raw:   decoded,
            };
            return true;
          }
        } catch {
          // Fall through to denial
        }
      }
    }

    throw new UnauthorizedException('Requires admin JWT or valid X-Internal-Token');
  }
}

/**
 * @CurrentUser() — inyecta req.user en handler. Si no hay user (no guard
 * aplicado o token inválido), devuelve null.
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
  id:    string;
  email: string;
  roles: string[];
  jti?:  string;
  raw:   Record<string, unknown>;
};
