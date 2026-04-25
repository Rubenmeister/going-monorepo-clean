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
    // CORS preflight (OPTIONS): respondemos local sin reenviar al upstream.
    // Fastify-cors no intercepta wildcards registrados sólo vía middleware,
    // y los upstreams no necesariamente tienen un handler OPTIONS — eso
    // resultaría en 404. Aquí emitimos 204 con headers CORS desde el
    // origin solicitante (que ya fue validado por enableCors() arriba en
    // la cadena, su onRequest hook deja `access-control-*` en res; si no
    // están, los añadimos defensivamente desde CORS_ORIGINS).
    if (req.method === 'OPTIONS') {
      const origin = req.headers?.origin;
      const allowed = (process.env.CORS_ORIGINS ?? '')
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean);
      if (origin && allowed.includes(origin)) {
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
      res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    });

    proxyReq.on('error', (err) => {
      logger.error(`Proxy error: ${err.message}`);
      if (!res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'application/json' });
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
      ar: this.configService.get<string>('AR_SERVICE_URL', 'http://localhost:3016'),
      blockchain: this.configService.get<string>('BLOCKCHAIN_SERVICE_URL', 'http://localhost:3018'),
      recommendations: this.configService.get<string>('RECOMMENDATION_SERVICE_URL', 'http://localhost:3020'),
      subscriptions: this.configService.get<string>('SUBSCRIPTION_SERVICE_URL', 'http://localhost:3021'),
      corporate: this.configService.get<string>('CORPORATE_SERVICE_URL', 'http://localhost:3022'),
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
    // /zones/* — geocercas (administradas por transport-service)
    guard('zones', svc.transport);
    // /drivers/* — bases de conductor + perfil (transport-service)
    guard('drivers', svc.transport);
    // /driver-bases/* — bases priorizadas (FASE 2)
    guard('driver-bases', svc.transport);
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
    guard('ar', svc.ar);
    guard('blockchain', svc.blockchain);
    guard('recommendations', svc.recommendations);
    guard('subscriptions', svc.subscriptions);
    guard('corporate', svc.corporate);

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

    // --- PUBLIC: /support/* → customer-support-service (WhatsApp webhook + web chat, no JWT) ---
    if (svc.support) {
      consumer
        .apply(makeForwardMiddleware(svc.support, 'support'))
        .forRoutes({ path: 'support/*path', method: RequestMethod.ALL });
    }
  }
}
