import { Module, MiddlewareConsumer, NestModule, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createProxyMiddleware } from 'http-proxy-middleware';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const passport = require('passport'); // CJS require avoids ESM/CJS interop issue with 'import * as'

@Module({})
export class ProxyModule implements NestModule {
  private readonly logger = new Logger(ProxyModule.name);

  constructor(private readonly configService: ConfigService) {}

  configure(consumer: MiddlewareConsumer) {
    // Lista de microservicios y sus URLs (del .env)
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

    // Shared proxy options for Cloud Run HTTPS targets
    const proxyOptions = (target: string, pathPrefix: string) => ({
      target,
      changeOrigin: true,
      secure: false, // Skip TLS verification for Cloud Run internal calls
      followRedirects: true,
      // Strip the path prefix before forwarding to the service
      pathRewrite: (path: string) => {
        // Remove the leading /<prefix> and keep the rest
        const rewritten =
          path.replace(new RegExp(`^/${pathPrefix}`), '') || '/';
        return rewritten;
      },
      on: {
        error: (err: Error, req: any, res: any) => {
          this.logger.error(`Proxy error [${pathPrefix}]: ${err.message}`);
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
        proxyReq: (proxyReq: any, req: any) => {
          this.logger.debug(
            `→ Proxy [${pathPrefix}]: ${req.method} ${req.url} → ${target}${proxyReq.path}`
          );
        },
      },
    });

    // --- PUBLIC ROUTES: /auth/* → user-auth-service ---
    consumer
      .apply(createProxyMiddleware(proxyOptions(services.auth, 'auth') as any))
      .forRoutes('auth');

    // --- PROTECTED ROUTES: JWT guard + proxy ---
    const applyAuthProxy = (path: string, targetService: string) => {
      consumer
        .apply(
          passport.authenticate('jwt', { session: false }),
          createProxyMiddleware(proxyOptions(targetService, path) as any)
        )
        .forRoutes(path);
    };

    applyAuthProxy('transport', services.transport);
    applyAuthProxy('payments', services.payments);
    applyAuthProxy('tours', services.tours);
    applyAuthProxy('accommodations', services.accommodations);
    applyAuthProxy('experiences', services.experiences);
    applyAuthProxy('parcels', services.parcels);
    applyAuthProxy('notifications', services.notifications);
    applyAuthProxy('tracking', services.tracking);
    applyAuthProxy('bookings', services.bookings);
  }
}
