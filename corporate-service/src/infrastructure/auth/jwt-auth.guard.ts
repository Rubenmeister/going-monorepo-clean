import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

/**
 * JwtAuthGuard standalone — verifica FIRMA + expiración del JWT con
 * jsonwebtoken (jwt.verify), sin @nestjs/passport ni libs del monorepo:
 * corporate-service se buildea en aislamiento (Dockerfile + package.json
 * propios), donde esos imports no resuelven. Mismo patrón que
 * notifications-service.
 *
 * Reemplaza la decodificación base64 SIN verificación que hacía el controller
 * (auditoría #2). Forjar {"roles":["admin"],"companyId":"<víctima>"} con
 * alg:none ya no sirve: jwt.verify rechaza firma inválida / alg no permitido.
 *
 * Puebla req.user = { userId, id, email, roles, companyId } para los helpers
 * del CorporateController.
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
      const decoded = jwt.verify(token, secret) as Record<string, unknown>;
      const userId = (decoded.sub as string) || (decoded.userId as string);
      if (!userId) throw new Error('Token without sub/userId');
      const rolesRaw = decoded.roles ?? decoded.role;
      const roles = Array.isArray(rolesRaw)
        ? (rolesRaw as string[])
        : typeof rolesRaw === 'string'
          ? [rolesRaw]
          : [];
      req.user = {
        userId,
        id: userId,
        email: (decoded.email as string) || '',
        roles,
        companyId: (decoded.companyId as string) || undefined,
      };
      return true;
    } catch (err) {
      throw new UnauthorizedException(
        `Invalid token: ${(err as Error).message || 'verification failed'}`,
      );
    }
  }
}
