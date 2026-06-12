import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { timingSafeEqual } from 'crypto';

/**
 * InternalServiceGuard — valida llamadas service-to-service.
 *
 * Acepta header `X-Internal-Token` con valor === INTERNAL_SERVICE_TOKEN env.
 * El endpoint /internal/payment-completed marca facturas como PAID, así que
 * NO debe aceptar un body forjado de cualquiera (auditoría #14). El caller
 * legítimo es payment-service (webhook), que ahora manda el token.
 *
 * Fail-closed: sin INTERNAL_SERVICE_TOKEN configurado, rechaza todo.
 * Comparación constant-time (timingSafeEqual).
 *
 * Sin deps externas (solo @nestjs/common + crypto nativo) → corre en el
 * build standalone de billing.
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
    if (typeof provided !== 'string' || !this.safeEqual(provided, expected)) {
      throw new UnauthorizedException('Invalid or missing X-Internal-Token');
    }
    return true;
  }

  private safeEqual(a: string, b: string): boolean {
    const ab = Buffer.from(a);
    const bb = Buffer.from(b);
    if (ab.length !== bb.length) return false;
    return timingSafeEqual(ab, bb);
  }
}
