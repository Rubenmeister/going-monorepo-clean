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
 * Blindaje (auditoría Bloque 2 #6/#10): GET /tracking/drivers/:id/location
 * expone la ubicación GPS en vivo de un conductor. Estaba SIN auth ("internal-
 * only por VPC") pero el servicio es alcanzable → cualquiera geolocalizaba a
 * cualquier conductora o conductor. El único caller legítimo es envios-service,
 * que ahora manda el token.
 *
 * Fail-closed: sin INTERNAL_SERVICE_TOKEN configurado, rechaza todo.
 * Comparación constant-time (timingSafeEqual). Sin deps externas (solo
 * @nestjs/common + crypto nativo) → corre en el build standalone de tracking.
 */
@Injectable()
export class InternalServiceGuard implements CanActivate {
  private readonly logger = new Logger(InternalServiceGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const provided = req.headers?.['x-internal-token'];
    const expected = process.env.INTERNAL_SERVICE_TOKEN;
    if (!expected) {
      this.logger.error(
        'INTERNAL_SERVICE_TOKEN no configurado — auth fail-closed'
      );
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
