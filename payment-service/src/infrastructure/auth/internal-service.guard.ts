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
 * Usado en operaciones que NO debe disparar un usuario final: complete-ride
 * (lo llama transport-service al cerrar un viaje) y payout/create (creación de
 * pagos a cuenta bancaria — admin/interno). Auditoría #1.
 *
 * Fail-closed: sin INTERNAL_SERVICE_TOKEN configurado, rechaza todo.
 * Comparación constant-time. Sin deps externas (solo @nestjs/common + crypto).
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
