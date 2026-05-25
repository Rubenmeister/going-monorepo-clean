import {
  Module,
  MiddlewareConsumer,
  NestModule,
  Logger,
  Injectable,
  NestMiddleware,
  RequestMethod,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as https from 'https';
import * as http from 'http';
import { URL } from 'url';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const passport = require('passport');

/**
 * Creates a pure Node.js reverse-proxy middleware targeting the given service URL.
 * Avoids http-proxy-middleware entirely — it silently hangs on Cloud Run HTTPS (HTTP/2).
 */
function makeForwardMiddleware(targetBase: string, stripPrefix: string) {
  const logger = new Logger(`Proxy:${stripPrefix}`);
  const parsed = new URL(targetBase);
  const isHttps = parsed.protocol === 'https:';
  const hostname = parsed.hostname;
  const port = parsed.port ? parseInt(parsed.port) : isHttps ? 443 : 80;
  const transport = isHttps ? https : http;

  return (req: any, res: any, next: () => void) => {
    // CORS: el proxy reenvía streams HTTP crudos al upstream, así que el
    // enableCors() de NestJS NO toca las respuestas del proxy. Tenemos que
    // emitir Access-Control-* manualmente — tanto en OPTIONS preflight como
    // en las respuestas reales (201, 401, 502, etc.) — porque el browser
    // rechaza CUALQUIER respuesta cross-origin sin Access-Control-Allow-Origin.
    const origin = req.headers?.origin;
    const allowedOrigins = (process.env.CORS_ORIGINS ?? '')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);
    const corsAllowed = !!(origin && allowedOrigins.includes(origin));
    const corsResponseHeaders: Record<string, string> = corsAllowed
      ? {
          'Access-Control-Allow-Origin': origin,
          'Vary': 'Origin',
          'Access-Control-Allow-Credentials': 'true',
        }
      : {};

    if (req.method === 'OPTIONS') {
      if (corsAllowed) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader(
          'Access-Control-Allow-Methods',
          'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        );
        res.setHeader(
          'Access-Control-Allow-Headers',
          req.headers['access-control-request-headers'] ||
            'Content-Type,Authorization,X-Requested-With,X-Request-ID',
        );
        res.setHeader('Access-Control-Max-Age', '3600');
      }
      res.statusCode = 204;
      res.end();
      return;
    }

    // originalUrl is stored by the Fastify onRequest hook (main.ts) before middie strips it.
    // req.raw.url works for Express. req.url is the fallback (may be prefix-stripped by middie).
    const originalUrl: string = req.originalUrl || req.raw?.url || req.url || '/';
    const rawPath = originalUrl.split('?')[0] || '/';
    const queryString = originalUrl.includes('?') ? originalUrl.slice(originalUrl.indexOf('?')) : '';
    const proxiedPath = rawPath.startsWith(`/${stripPrefix}`)
      ? rawPath + queryString            // full path already present (Fastify or Express without stripping)
      : `/${stripPrefix}${rawPath === '/' ? '' : rawPath}${queryString}`; // Express: prefix stripped
    logger.debug(`→ ${req.method} ${proxiedPath} to ${targetBase}`);

    // Este middleware se registra en la etapa `onRequest` de Fastify (vía
    // middie), que corre ANTES de que Fastify parsee el JSON. Por eso
    // `req.body` está indefinido en la mayoría de peticiones. Además nunca
    // llamamos `next()` — respondemos directo al cliente — así que el hook
    // `preHandler` que copia request.body → raw.body tampoco dispara.
    //
    // Solución: pipear el stream crudo (IncomingMessage) al upstream.
    //
    // Retrocompat: si por algún camino NestJS ya parseó `req.body` (ej. tests
    // con Express adapter), re-serializamos esa estructura.

    const hasPreParsedBody =
      req.body !== undefined &&
      req.body !== null &&
      (typeof req.body !== 'object' || Object.keys(req.body).length > 0);

    const headers: Record<string, any> = {
      ...req.headers,
      host: hostname,
    };

    // Si pre-parseado, fijamos content-length y content-type; si no, dejamos
    // que Node reenvíe los headers originales + chunked transfer del stream.
    let bodyBuf: Buffer | null = null;
    if (hasPreParsedBody) {
      const bodyStr =
        typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      bodyBuf = Buffer.from(bodyStr, 'utf8');
      headers['content-type'] = 'application/json';
      headers['content-length'] = bodyBuf.length;
    } else {
      // Fastify/middie puede dejar content-length stale; lo quitamos para que
      // Node use transfer-encoding: chunked al pipear.
      delete headers['content-length'];
    }

    const options: https.RequestOptions = {
      hostname,
      port,
      path: proxiedPath,
      method: req.method,
      headers,
      rejectUnauthorized: false,
    };

    const proxyReq = transport.request(options, (proxyRes) => {
      logger.debug(`← ${proxyRes.statusCode} from ${targetBase}${proxiedPath}`);
      // Mergear CORS sobre los headers del upstream para que el browser
      // acepte la respuesta cross-origin (sin esto, todo response sin OPTIONS
      // falla con "Failed to fetch" desde app.goingec.com).
      res.writeHead(proxyRes.statusCode ?? 502, {
        ...proxyRes.headers,
        ...corsResponseHeaders,
      });
      proxyRes.pipe(res, { end: true });
    });

    proxyReq.on('error', (err) => {
      logger.error(`Proxy error: ${err.message}`);
      if (!res.headersSent) {
        res.writeHead(502, {
          'Content-Type': 'application/json',
          ...corsResponseHeaders,
        });
        res.end(
          JSON.stringify({ statusCode: 502, message: 'Service unavailable' })
        );
      }
    });

    proxyReq.setTimeout(25000, () => {
      logger.error(`Proxy timeout for ${targetBase}${proxiedPath}`);
      proxyReq.destroy();
    });

    if (bodyBuf) {
      proxyReq.write(bodyBuf);
      proxyReq.end();
    } else if (req.readable) {
      // Pipe directo del IncomingMessage al upstream.
      req.pipe(proxyReq);
      req.on('error', (err: Error) => {
        logger.error(`Upstream pipe error: ${err.message}`);
        proxyReq.destroy(err);
      });
    } else {
      proxyReq.end();
    }
  };
}

@Module({})
export class ProxyModule implements NestModule {
  private readonly logger = new Logger(ProxyModule.name);

  constructor(private readonly configService: ConfigService) {}

  configure(consumer: MiddlewareConsumer) {
    const svc = {
      auth: this.configService.get<string>('USER_AUTH_SERVICE_URL', ''),
      transport: this.configService.get<string>('TRANSPORT_SERVICE_URL', ''),
      payments: this.configService.get<string>('PAYMENT_SERVICE_URL', ''),
      tours: this.configService.get<string>('TOURS_SERVICE_URL', ''),
      accommodations: this.configService.get<string>(
        'ANFITRIONES_SERVICE_URL',
        ''
      ),
      experiences: this.configService.get<string>(
        'EXPERIENCIAS_SERVICE_URL',
        ''
      ),
      parcels: this.configService.get<string>('ENVIOS_SERVICE_URL', ''),
      notifications: this.configService.get<string>(
        'NOTIFICATIONS_SERVICE_URL',
        ''
      ),
      tracking: this.configService.get<string>('TRACKING_SERVICE_URL', ''),
      bookings: this.configService.get<string>('BOOKING_SERVICE_URL', ''),
      invoices: this.configService.get<string>('BILLING_SERVICE_URL', ''),
      analytics: this.configService.get<string>('ANALYTICS_SERVICE_URL', ''),
      support: this.configService.get<string>('CUSTOMER_SUPPORT_SERVICE_URL', ''),
      social: this.configService.get<string>('SOCIAL_SERVICE_URL', 'http://localhost:3019'),
      corporate: this.configService.get<string>('CORPORATE_SERVICE_URL', 'http://localhost:3022'),
      emergency: this.configService.get<string>('EMERGENCY_SERVICE_URL', ''),
      voice:     this.configService.get<string>('VOICE_CALL_SERVICE_URL', ''),
    };

    this.logger.log(`Proxy ready → auth: ${svc.auth}`);

    // --- PUBLIC: /auth/* → user-auth-service (no JWT required) ---
    if (svc.auth) {
      consumer
        .apply(makeForwardMiddleware(svc.auth, 'auth'))
        .forRoutes({ path: 'auth/*path', method: RequestMethod.ALL });
    }

    // OPTIONS (CORS preflight) NUNCA debe pasar por passport.authenticate:
    // los preflights NO llevan Authorization header. Wrapper que delega al
    // siguiente middleware sin auth si es OPTIONS, y aplica passport en
    // cualquier otro caso. Sin este wrapper el navegador recibe 401 en el
    // preflight y la petición real (POST/PUT/etc.) ni se envía.
    const jwtAuthSkipOptions = (req: any, res: any, next: any) => {
      if (req.method === 'OPTIONS') return next();
      return passport.authenticate('jwt', { session: false })(req, res, next);
    };

    // --- PROTECTED: JWT guard + forward ---
    const guard = (prefix: string, target: string) => {
      if (!target) return;
      consumer
        .apply(jwtAuthSkipOptions, makeForwardMiddleware(target, prefix))
        .forRoutes({ path: `${prefix}/*path`, method: RequestMethod.ALL });
    };

    /**
     * Exact-collection forward: NestJS no matchea `/parcels` con el patrón
     * `parcels/*path`. Para endpoints de colección (POST /parcels) hay que
     * registrar la ruta exacta por separado. Lo hacemos sólo donde la API
     * real lo requiere para no expandir la superficie de routing.
     */
    const guardExact = (prefix: string, target: string, methods: RequestMethod[]) => {
      if (!target) return;
      const routes = methods.map((method) => ({ path: prefix, method }));
      consumer
        .apply(jwtAuthSkipOptions, makeForwardMiddleware(target, prefix))
        .forRoutes(...routes);
    };

    guard('transport', svc.transport);
    // /rides/* — pedido de viajes (RideController del transport-service).
    // Diferente de /transport/* que usa el TransportController/Trip más simple.
    // Esta es la ruta que usa el frontend webapp para crear viajes con matching.
    guard('rides', svc.transport);
    // /zones/* — geocercas (administradas por transport-service)
    guard('zones', svc.transport);
    // /search/* — buscador unificado de viajes (transport-service)
    guard('search', svc.transport);
    // /scheduled-trips/* — reserva de asientos en viajes compartidos (transport-service)
    guard('scheduled-trips', svc.transport);

    // /drivers/me/wallet|earnings|earnings/history|withdraw → payment-service
    // (DriverEarningsController). Estas rutas conviven con el prefix /drivers
    // de transport-service: las registramos PRIMERO para que el middleware de
    // payment matchee antes que el catch-all `/drivers/*` → transport.
    if (svc.payments) {
      const driverEarningsRoutes = [
        { path: 'drivers/me/wallet', method: RequestMethod.GET },
        { path: 'drivers/me/earnings', method: RequestMethod.GET },
        { path: 'drivers/me/earnings/history', method: RequestMethod.GET },
        { path: 'drivers/me/withdraw', method: RequestMethod.POST },
      ];
      consumer
        .apply(jwtAuthSkipOptions, makeForwardMiddleware(svc.payments, 'drivers'))
        .forRoutes(...driverEarningsRoutes);
    }

    // /drivers/* — bases de conductor + perfil (transport-service)
    guard('drivers', svc.transport);
    // /driver-bases/* — bases priorizadas (FASE 2)
    guard('driver-bases', svc.transport);
    // /driver-hybrid/* — Hybrid Mode (Fase E): driver en intercity acepta
    // carreras locales en destino. Endpoints: start-local-mode, complete-return,
    // cancel, me. JWT-guarded, valida role en cada handler.
    guard('driver-hybrid', svc.transport);
    guard('payments', svc.payments);
    guard('tours', svc.tours);
    guard('accommodations', svc.accommodations);
    guard('experiences', svc.experiences);
    guard('parcels', svc.parcels);
    guard('notifications', svc.notifications);
    guard('tracking', svc.tracking);
    guard('bookings', svc.bookings);
    guard('invoices', svc.invoices);
    guard('analytics', svc.analytics);
    guard('social', svc.social);
    guard('corporate', svc.corporate);

    // /sos y /incidents → emergency-service. Auth JWT en ambos (la propia
    // controller-side re-valida y exige role admin/operator para incidents).
    // /sos es protected porque queremos saber QUIÉN dispara la alerta; el
    // mismo controller hace match jwt.sub === body.userId para evitar
    // impersonation.
    guard('sos', svc.emergency);
    guard('incidents', svc.emergency);

    // /voice-calls → voice-call-service (Uyari). Solo audit endpoints
    // (GET /voice-calls, GET /:id, /active, /stats) — expone transcripts PII.
    // El path /twilio/* (webhooks) NO va por el gateway — Twilio llama
    // directo al service URL configurado en la Twilio console.
    guard('voice-calls', svc.voice);

    // --- Exact-collection roots ---
    // NestJS 11 + Fastify 5: el patrón `prefix/*path` NO matchea la raíz
    // exacta `/prefix` (porque `*path` requiere ≥1 segmento). Para rutas
    // de colección como GET /zones, POST /parcels, GET /bookings, los
    // registramos explícitamente con `guardExact`. Sin esto el caller
    // recibe 404 desde el gateway aunque el endpoint exista río abajo.
    const allMethods = [
      RequestMethod.GET,
      RequestMethod.POST,
      RequestMethod.PUT,
      RequestMethod.PATCH,
      RequestMethod.DELETE,
    ];
    guardExact('zones', svc.transport, allMethods);
    guardExact('search', svc.transport, allMethods);
    guardExact('drivers', svc.transport, allMethods);
    guardExact('driver-bases', svc.transport, allMethods);
    guardExact('parcels', svc.parcels, allMethods);
    guardExact('bookings', svc.bookings, allMethods);
    guardExact('payments', svc.payments, allMethods);
    guardExact('tours', svc.tours, allMethods);
    guardExact('accommodations', svc.accommodations, allMethods);
    guardExact('experiences', svc.experiences, allMethods);
    guardExact('tracking', svc.tracking, allMethods);
    guardExact('notifications', svc.notifications, allMethods);
    guardExact('invoices', svc.invoices, allMethods);
    guardExact('analytics', svc.analytics, allMethods);
    guardExact('social', svc.social, allMethods);
    // /sos es solo POST; /incidents soporta GET (lista) y PATCH no aplica al
    // root sino a /incidents/:id (cubierto por el `guard('incidents', ...)`).
    guardExact('sos',         svc.emergency, [RequestMethod.POST]);
    guardExact('incidents',   svc.emergency, [RequestMethod.GET]);
    guardExact('voice-calls', svc.voice,     [RequestMethod.GET]);

    // --- PUBLIC: /support/* → customer-support-service (WhatsApp webhook + web chat, no JWT) ---
    if (svc.support) {
      consumer
        .apply(makeForwardMiddleware(svc.support, 'support'))
        .forRoutes({ path: 'support/*path', method: RequestMethod.ALL });
    }
  }
}
