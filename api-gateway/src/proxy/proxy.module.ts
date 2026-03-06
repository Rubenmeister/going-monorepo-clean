import {
  Module,
  MiddlewareConsumer,
  NestModule,
  Logger,
  Injectable,
  NestMiddleware,
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
    // Strip prefix from path: /auth/register → /auth/register (kept as-is for auth)
    // because user-auth-service already serves /auth/*
    const rawPath = req.url || '/';
    logger.debug(`→ ${req.method} ${rawPath} to ${targetBase}`);

    const options: https.RequestOptions = {
      hostname,
      port,
      path: rawPath,
      method: req.method,
      headers: {
        ...req.headers,
        host: hostname, // rewrite host header
      },
      rejectUnauthorized: false, // skip TLS verification for internal Cloud Run calls
    };

    const proxyReq = transport.request(options, (proxyRes) => {
      logger.debug(`← ${proxyRes.statusCode} from ${targetBase}${rawPath}`);
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
      logger.error(`Proxy timeout for ${targetBase}${rawPath}`);
      proxyReq.destroy();
    });

    req.pipe(proxyReq, { end: true });
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
    };

    this.logger.log(`Proxy ready → auth: ${svc.auth}`);

    // --- PUBLIC: /auth/* → user-auth-service (no JWT required) ---
    if (svc.auth) {
      consumer.apply(makeForwardMiddleware(svc.auth, 'auth')).forRoutes('auth');
    }

    // --- PROTECTED: JWT guard + forward ---
    const guard = (prefix: string, target: string) => {
      if (!target) return;
      consumer
        .apply(
          passport.authenticate('jwt', { session: false }),
          makeForwardMiddleware(target, prefix)
        )
        .forRoutes(prefix);
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
  }
}
