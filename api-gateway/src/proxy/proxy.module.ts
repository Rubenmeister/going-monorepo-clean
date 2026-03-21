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
    // In Fastify+middie, middie may strip the route prefix from req.url (e.g. auth/* strips
    // /auth/login → req.url = '/login' or even '/').
    // req.raw.url (Node.js IncomingMessage) is never modified by middie and always has the
    // full original path (e.g. /auth/login).  Fall back to req.url for Express mode.
    const originalUrl: string = req.raw?.url || req.url || '/';
    const rawPath = originalUrl.split('?')[0] || '/';
    const queryString = originalUrl.includes('?') ? originalUrl.slice(originalUrl.indexOf('?')) : '';
    const proxiedPath = rawPath.startsWith(`/${stripPrefix}`)
      ? rawPath + queryString            // full path already present (Fastify or Express without stripping)
      : `/${stripPrefix}${rawPath === '/' ? '' : rawPath}${queryString}`; // Express: prefix stripped
    logger.debug(`→ ${req.method} ${proxiedPath} to ${targetBase}`);

    // NestJS body-parser already consumed the request stream before middleware runs.
    // Must re-serialize from req.body instead of piping the raw stream.
    const bodyStr =
      req.body && Object.keys(req.body).length > 0
        ? JSON.stringify(req.body)
        : '';
    const bodyBuf = Buffer.from(bodyStr, 'utf8');

    const options: https.RequestOptions = {
      hostname,
      port,
      path: proxiedPath,
      method: req.method,
      headers: {
        ...req.headers,
        host: hostname,
        'content-type': 'application/json',
        'content-length': bodyBuf.length,
      },
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

    if (bodyBuf.length > 0) proxyReq.write(bodyBuf);
    proxyReq.end();
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
    };

    this.logger.log(`Proxy ready → auth: ${svc.auth}`);

    // --- PUBLIC: /auth/* → user-auth-service (no JWT required) ---
    if (svc.auth) {
      consumer
        .apply(makeForwardMiddleware(svc.auth, 'auth'))
        .forRoutes({ path: 'auth', method: RequestMethod.ALL }, { path: 'auth/*', method: RequestMethod.ALL });
    }

    // --- PROTECTED: JWT guard + forward ---
    const guard = (prefix: string, target: string) => {
      if (!target) return;
      consumer
        .apply(
          passport.authenticate('jwt', { session: false }),
          makeForwardMiddleware(target, prefix)
        )
        .forRoutes(
          { path: prefix, method: RequestMethod.ALL },
          { path: `${prefix}/*`, method: RequestMethod.ALL }
        );
    };

    guard('transport', svc.transport);
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

    // --- PUBLIC: /support/* → customer-support-service (WhatsApp webhook + web chat, no JWT) ---
    if (svc.support) {
      consumer
        .apply(makeForwardMiddleware(svc.support, 'support'))
        .forRoutes(
          { path: 'support', method: RequestMethod.ALL },
          { path: 'support/*', method: RequestMethod.ALL }
        );
    }
  }
}
