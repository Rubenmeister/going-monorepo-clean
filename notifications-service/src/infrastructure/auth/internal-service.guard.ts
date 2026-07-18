import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { timingSafeEqual } from 'crypto';

/**
 * InternalServiceGuard — valida llamadas servicio-a-servicio.
 *
 * Acepta header `X-Internal-Token` con valor === INTERNAL_SERVICE_TOKEN.
 * Mismo patrón que billing-service (auditoría #14), para no inventar un
 * mecanismo distinto por servicio.
 *
 * Existe porque `POST /notifications/send` exige rol admin|system y los avisos
 * corporativos los emite corporate-service, que no tiene un usuario detrás:
 * hasta ahora llamaba SIN token y por eso ninguna invitación ni aviso salía.
 *
 * Fail-closed: sin INTERNAL_SERVICE_TOKEN configurado rechaza todo.
 * Comparación en tiempo constante (timingSafeEqual).
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
      throw new UnauthorizedException('X-Internal-Token inválido o ausente');
    }
    return true;
  }

  private safeEqual(a: string, b: string): boolean {
    const ba = Buffer.from(a);
    const bb = Buffer.from(b);
    if (ba.length !== bb.length) return false;
    return timingSafeEqual(ba, bb);
  }
}
