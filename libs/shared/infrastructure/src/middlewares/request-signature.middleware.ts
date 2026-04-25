import {
  Injectable,
  NestMiddleware,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';

/**
 * RequestSignatureMiddleware — verifica firma HMAC en requests
 * inter-servicio que apunten a `/internal/*`.
 *
 * Headers esperados del caller:
 *   X-Service-Signature  hex(HMAC_SHA256(secret, `${ts}|${method}|${path}|${bodyHash}`))
 *   X-Service-Timestamp  unix-ms del momento de firma
 *   X-Service-Caller     identificador opcional del caller (logging)
 *
 * Reglas:
 *   - Sólo se aplica a paths que empiezan con `/internal/` (resto pasa
 *     directo — el JWT auth normal protege rutas de usuario).
 *   - Si `INTERNAL_SERVICE_TOKEN` no está set, fail-closed: 401 en todo
 *     `/internal/*` (mejor que aceptar tráfico sin firma).
 *   - Tolerancia de clock skew: 30 segundos. Replays más viejos que eso
 *     se rechazan.
 *   - Comparación constant-time con `timingSafeEqual` para evitar
 *     timing attacks.
 *
 * Uso desde un caller (payment-service → user-auth-service):
 *   const ts = Date.now();
 *   const body = JSON.stringify(payload);
 *   const bodyHash = createHash('sha256').update(body).digest('hex');
 *   const msg = `${ts}|POST|/internal/points/award|${bodyHash}`;
 *   const sig = createHmac('sha256', secret).update(msg).digest('hex');
 *
 * Por ahora `INTERNAL_SERVICE_TOKEN` se reusa como secret HMAC compartido.
 * En producción avanzada, conviene un secret dedicado por par de servicios.
 */
@Injectable()
export class RequestSignatureMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestSignatureMiddleware.name);
  private readonly clockSkewMs = 30_000;

  use(req: any, res: any, next: (err?: any) => void) {
    const path: string = req.path || req.originalUrl || '';
    // Aceptamos `/internal/*` o `/<prefix>/internal/*` (ej.
    // `/auth/internal/points/award`) — cualquier segmento `internal`
    // bajo la raíz cuenta.
    const isInternal = /(?:^|\/)internal\//.test(path);

    if (!isInternal) {
      return next();
    }

    const secret = process.env.INTERNAL_SERVICE_TOKEN;
    if (!secret) {
      // Fail-closed: si el secret no está configurado, no podemos
      // validar — rechazamos el tráfico para evitar exposición.
      this.logger.error(
        `INTERNAL_SERVICE_TOKEN no configurado — bloqueando ${path}`,
      );
      return next(new UnauthorizedException('Internal endpoint not configured'));
    }

    const sig = req.headers['x-service-signature'] as string | undefined;
    const tsHeader = req.headers['x-service-timestamp'] as string | undefined;
    const caller = req.headers['x-service-caller'] as string | undefined;

    if (!sig || !tsHeader) {
      this.logger.warn(
        `Internal request sin firma: ${req.method} ${path} (caller=${caller ?? 'unknown'})`,
      );
      return next(new UnauthorizedException('Missing service signature'));
    }

    const ts = parseInt(tsHeader, 10);
    if (Number.isNaN(ts) || Math.abs(Date.now() - ts) > this.clockSkewMs) {
      this.logger.warn(
        `Timestamp fuera de ventana (${tsHeader}) en ${path}`,
      );
      return next(new UnauthorizedException('Stale or invalid timestamp'));
    }

    // bodyHash: empty string si no hay body (req.rawBody puede no estar
    // si express.json() ya consumió el stream).
    const rawBody = (req as any).rawBody ?? '';
    const bodyStr =
      typeof rawBody === 'string'
        ? rawBody
        : Buffer.isBuffer(rawBody)
          ? rawBody.toString('utf8')
          : req.body
            ? JSON.stringify(req.body)
            : '';
    const bodyHash = createHmac('sha256', secret).update(bodyStr).digest('hex');

    const msg = `${ts}|${req.method}|${path}|${bodyHash}`;
    const expected = createHmac('sha256', secret).update(msg).digest('hex');

    let match = false;
    try {
      const a = Buffer.from(sig, 'hex');
      const b = Buffer.from(expected, 'hex');
      if (a.length === b.length) {
        match = timingSafeEqual(a, b);
      }
    } catch {
      match = false;
    }

    if (!match) {
      this.logger.warn(
        `Firma inválida en ${path} (caller=${caller ?? 'unknown'})`,
      );
      return next(new UnauthorizedException('Invalid service signature'));
    }

    this.logger.debug(
      `Internal request OK: ${req.method} ${path} (caller=${caller ?? 'unknown'})`,
    );
    return next();
  }
}

/**
 * Helper para callers — genera headers de firma HMAC para una request
 * inter-servicio. Reutilizable desde cualquier microservicio que llame
 * a otro endpoint `/internal/*`.
 */
export function buildInternalServiceHeaders(args: {
  secret: string;
  method: string;
  path: string;
  body?: unknown;
  caller: string;
}): Record<string, string> {
  const ts = Date.now();
  const bodyStr = args.body == null ? '' : JSON.stringify(args.body);
  const bodyHash = createHmac('sha256', args.secret)
    .update(bodyStr)
    .digest('hex');
  const msg = `${ts}|${args.method.toUpperCase()}|${args.path}|${bodyHash}`;
  const sig = createHmac('sha256', args.secret).update(msg).digest('hex');
  return {
    'X-Service-Signature': sig,
    'X-Service-Timestamp': String(ts),
    'X-Service-Caller': args.caller,
  };
}
