import { Body, Controller, Get, HttpCode, Logger, Post, Query } from '@nestjs/common';
import { createHash } from 'crypto';
import { WebEventRepository } from '../infrastructure/persistence/web-event.repository';

interface WebEventBody {
  appId:      string;
  errorType?: 'js_error' | 'unhandled_rejection' | 'network' | 'render' | 'other';
  message:    string;
  stack?:     string;
  url:        string;
  userAgent?: string;
  // Si el client provee dedupKey, se respeta. Si no, lo computamos acá.
  dedupKey?:  string;
  sessionId?: string;
}

const VALID_APPS = new Set(['frontend-webapp', 'admin-dashboard', 'corporate-portal']);
const VALID_TYPES: Array<'js_error' | 'unhandled_rejection' | 'network' | 'render' | 'other'> = [
  'js_error', 'unhandled_rejection', 'network', 'render', 'other',
];

/**
 * Endpoint público (sin auth) que recibe errores JS de las web apps.
 *
 *   POST /cerebro/web-event
 *   { appId, errorType?, message, stack?, url, userAgent?, dedupKey?, sessionId? }
 *
 *   GET  /cerebro/web-events?app=<appId>&hours=6&limit=25
 *   → top errores por count en la ventana, usado por frontend-agent.
 *
 * Sin auth porque viene del browser de un usuario anónimo. Riesgo:
 * pollution de fake events. Mitigación: rate-limit por IP (futuro), validate
 * appId estricto (acá), rechazo de payloads >50KB (futuro).
 *
 * No bloqueante: si Mongo está caído, devuelve 200 igual — el cliente no
 * puede reaccionar a un fail en error reporting (causaría más errores).
 */
@Controller('cerebro')
export class WebEventController {
  private readonly logger = new Logger(WebEventController.name);

  constructor(private readonly events: WebEventRepository) {}

  @Post('web-event')
  @HttpCode(200)
  async ingest(@Body() body: WebEventBody) {
    if (!body?.appId || !VALID_APPS.has(body.appId)) {
      return { ok: false, error: 'invalid_appId' };
    }
    if (!body.message || !body.url) {
      return { ok: false, error: 'missing_required_fields' };
    }
    const errorType = (body.errorType && VALID_TYPES.includes(body.errorType))
      ? body.errorType
      : 'other';

    // Si el client no mandó dedupKey, lo derivamos del fingerprint server-side.
    // Topframe del stack es lo que más nos importa para agrupar.
    const dedupKey = body.dedupKey || computeDedupKey({
      appId:     body.appId,
      errorType,
      stack:     body.stack,
      url:       body.url,
      message:   body.message,
    });

    try {
      const doc = await this.events.upsert({
        appId:     body.appId,
        errorType,
        message:   body.message,
        stack:     body.stack,
        url:       body.url,
        userAgent: body.userAgent,
        dedupKey,
        sessionId: body.sessionId,
      });
      return { ok: true, count: doc.count };
    } catch (e) {
      // Best-effort: log y devolver 200 igual.
      this.logger.warn(`web-event upsert failed: ${(e as Error).message}`);
      return { ok: true, error: 'persistence_failed_logged' };
    }
  }

  @Get('web-events')
  async list(
    @Query('app')   app?: string,
    @Query('hours') hoursStr?: string,
    @Query('limit') limitStr?: string,
  ) {
    const hours = parseInt(hoursStr || '6', 10);
    const safeHours = Number.isFinite(hours) && hours > 0 && hours <= 168 ? hours : 6;
    const sinceMs = Date.now() - safeHours * 3600 * 1000;
    const limit = parseInt(limitStr || '25', 10);
    const safeLimit = Number.isFinite(limit) && limit > 0 && limit <= 200 ? limit : 25;

    const events = await this.events.topByApp({
      appId:   app && VALID_APPS.has(app) ? app : undefined,
      sinceMs,
      limit:   safeLimit,
    });
    return {
      windowHours: safeHours,
      count:       events.length,
      events,
    };
  }
}

/**
 * Server-side fallback dedupKey. El client idealmente lo computa
 * (deterministic hash en JS) pero si no lo hace, lo derivamos.
 * SHA-256 → primeros 16 chars hex. Suficiente para evitar colisiones
 * razonables (~10^14 errors antes de colisión esperada).
 */
function computeDedupKey(args: {
  appId:     string;
  errorType: string;
  stack?:    string;
  url:       string;
  message:   string;
}): string {
  // Top frame del stack es lo más estable para agrupar el "mismo" error.
  const topFrame = (args.stack || args.message).split('\n')[0].trim().slice(0, 200);
  const fingerprint = `${args.appId}|${args.errorType}|${args.url}|${topFrame}`;
  return createHash('sha256').update(fingerprint).digest('hex').slice(0, 16);
}
