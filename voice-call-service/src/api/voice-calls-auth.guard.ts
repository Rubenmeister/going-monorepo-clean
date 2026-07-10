import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { timingSafeEqual } from 'crypto';
import * as jwt from 'jsonwebtoken';

/** Roles con permiso para ver transcripciones y auditoría de llamadas. */
const ADMIN_ROLES = new Set([
  'admin',
  'super_admin',
  'ops',
  'operator',
  'ADMIN',
  'SUPER_ADMIN',
  'OPS',
  'OPERATOR',
]);

/**
 * Guard para VoiceCallsController (auditoría Bloque 2 #12).
 *
 * Los endpoints /voice-calls exponen TRANSCRIPCIONES (PII) y estaban SIN guard,
 * confiando en que "el gateway protege". Pero voice-call-service tiene
 * ingress=all (público) → cualquiera leía transcripciones y hacía IDOR por
 * callId. Defensa en profundidad en el propio servicio:
 *
 *  - Vía S2S / herramientas de ops: `X-Internal-Token: <INTERNAL_SERVICE_TOKEN>`.
 *  - Vía usuario: `Authorization: Bearer <JWT>` con rol admin/operator. Verifica
 *    dual HS256/RS256 con raw jsonwebtoken (patrón standalone del monorepo; el
 *    flip RS256 ya está activo → probamos RS256 primero y HS256 de respaldo).
 *
 * Fail-closed: sin credencial válida → 401/403. Un pasajero/conductor normal
 * (rol 'user'/'driver') queda fuera aunque tenga JWT válido.
 */
@Injectable()
export class VoiceCallsAuthGuard implements CanActivate {
  private readonly logger = new Logger(VoiceCallsAuthGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();

    // 1) S2S / ops tooling con token interno.
    const internal = process.env.INTERNAL_SERVICE_TOKEN;
    const provided = req.headers?.['x-internal-token'];
    if (
      internal &&
      typeof provided === 'string' &&
      this.safeEqual(provided, internal)
    ) {
      return true;
    }

    // 2) JWT de admin/operator.
    const auth = req.headers?.['authorization'];
    if (typeof auth !== 'string' || !auth.startsWith('Bearer ')) {
      throw new UnauthorizedException('Autenticación requerida');
    }
    const payload = this.verify(auth.slice(7));
    if (!payload) {
      throw new UnauthorizedException('Token inválido');
    }
    if (!ADMIN_ROLES.has(payload.role)) {
      throw new ForbiddenException('Rol admin/operator requerido');
    }
    return true;
  }

  private verify(token: string): any | null {
    const rs = process.env.RS256_PUBLIC_KEY;
    if (rs) {
      try {
        return jwt.verify(token, rs.replace(/\\n/g, '\n'), {
          algorithms: ['RS256'],
        });
      } catch {
        /* cae a HS256 */
      }
    }
    const hs = process.env.JWT_SECRET;
    if (hs) {
      try {
        return jwt.verify(token, hs, { algorithms: ['HS256'] });
      } catch {
        /* inválido */
      }
    }
    return null;
  }

  private safeEqual(a: string, b: string): boolean {
    const ab = Buffer.from(a);
    const bb = Buffer.from(b);
    if (ab.length !== bb.length) return false;
    return timingSafeEqual(ab, bb);
  }
}
