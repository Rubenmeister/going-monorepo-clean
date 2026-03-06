import { Module, MiddlewareConsumer, NestModule, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createProxyMiddleware } from 'http-proxy-middleware';
import * as https from 'https';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const passport = require('passport'); // CJS require avoids ESM/CJS interop issue with 'import * as'

// Force HTTP/1.1 agent — Cloud Run HTTPS uses HTTP/2 by default
// but http-proxy doesn't support HTTP/2, causing silent hangs.
const httpsAgent = new https.Agent({
  rejectUnauthorized: false, // skip TLS verification for internal Cloud Run calls
  keepAlive: false, // no keep-alive to avoid connection reuse issues
  ALPNProtocols: ['http/1.1'], // force HTTP/1.1
});

@Module({})
export class ProxyModule implements NestModule {
  private readonly logger = new Logger(ProxyModule.name);

  constructor(private readonly configService: ConfigService) {}

  configure(consumer: MiddlewareConsumer) {
    const services = {
      auth: this.configService.get('USER_AUTH_SERVICE_URL'),
      transport: this.configService.get('TRANSPORT_SERVICE_URL'),
      payments: this.configService.get('PAYMENT_SERVICE_URL'),
      tours: this.configService.get('TOURS_SERVICE_URL'),
      accommodations: this.configService.get('ANFITRIONES_SERVICE_URL'),
      experiences: this.configService.get('EXPERIENCIAS_SERVICE_URL'),
      parcels: this.configService.get('ENVIOS_SERVICE_URL'),
      notifications: this.configService.get('NOTIFICATIONS_SERVICE_URL'),
      tracking: this.configService.get('TRACKING_SERVICE_URL'),
      bookings: this.configService.get('BOOKING_SERVICE_URL'),
    };

    this.logger.log(`Proxy configured → auth: ${services.auth}`);

    const makeProxy = (target: string, prefix: string) =>
      createProxyMiddleware({
        target,
        changeOrigin: true,
        secure: false,
        agent: httpsAgent,
        pathRewrite: (path: string) =>
          path.replace(new RegExp(`^/${prefix}`), '') || '/',
        on: {
          error: (err: Error, _req: any, res: any) => {
            this.logger.error(`Proxy error [${prefix}]: ${err.message}`);
            if (!res.headersSent) {
              res.writeHead(502, { 'Content-Type': 'application/json' });
              res.end(
                JSON.stringify({
                  statusCode: 502,
                  message: 'Service unavailable',
                })
              );
            }
          },
          proxyReq: (_proxyReq: any, req: any) => {
            this.logger.debug(`→ [${prefix}] ${req.method} ${req.url}`);
          },
        },
      } as any);

    // --- PUBLIC: /auth/* → user-auth-service ---
    consumer.apply(makeProxy(services.auth, 'auth')).forRoutes('auth');

    // --- PROTECTED: JWT + proxy ---
    const guard = (path: string, target: string) => {
      consumer
        .apply(
          passport.authenticate('jwt', { session: false }),
          makeProxy(target, path)
        )
        .forRoutes(path);
    };

    guard('transport', services.transport);
    guard('payments', services.payments);
    guard('tours', services.tours);
    guard('accommodations', services.accommodations);
    guard('experiences', services.experiences);
    guard('parcels', services.parcels);
    guard('notifications', services.notifications);
    guard('tracking', services.tracking);
    guard('bookings', services.bookings);
  }
}
