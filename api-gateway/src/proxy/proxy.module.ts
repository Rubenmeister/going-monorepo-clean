import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createProxyMiddleware } from 'http-proxy-middleware';
import passport from 'passport';

@Module({})
export class ProxyModule implements NestModule {
  constructor(private readonly configService: ConfigService) {}

  configure(consumer: MiddlewareConsumer) {
    const services = {
      auth: this.configService.get('USER_AUTH_SERVICE_URL'),
      transport: this.configService.get('TRANSPORT_SERVICE_URL'),
      payments: this.configService.get('PAYMENT_SERVICE_URL'),
      tours: this.configService.get('TOURS_SERVICE_URL'),
      hosts: this.configService.get('HOSTS_SERVICE_URL'), // Updated key
      experiences: this.configService.get('EXPERIENCES_SERVICE_URL'),
      parcels: this.configService.get('PARCELS_SERVICE_URL'),
      notifications: this.configService.get('NOTIFICATIONS_SERVICE_URL'),
      tracking: this.configService.get('TRACKING_SERVICE_URL'),
      bookings: this.configService.get('BOOKING_SERVICE_URL'),
    };

    // Public Routes (Auth)
    consumer
      .apply(
        createProxyMiddleware({
          target: services.auth,
          changeOrigin: true,
          pathRewrite: { '^/api/auth': '/auth' }, // Auth service has /auth prefix in Controller
        }),
      )
      .forRoutes('auth');

    // Protected Routes
    const applyAuthProxy = (path: string, targetService: string) => {
      if (!targetService) return; // Skip if URL not configured
      consumer
        .apply(
          passport.authenticate('jwt', { session: false }),
          createProxyMiddleware({
            target: targetService,
            changeOrigin: true,
            pathRewrite: { [`^/api/${path}`]: '/api' }, // Most services have Global Prefix 'api'
          }),
        )
        .forRoutes(path);
    };

    applyAuthProxy('transport', services.transport);
    applyAuthProxy('payments', services.payments);
    applyAuthProxy('tours', services.tours);
    applyAuthProxy('hosts', services.hosts); // Updated route name
    applyAuthProxy('experiences', services.experiences);
    applyAuthProxy('parcels', services.parcels);
    applyAuthProxy('notifications', services.notifications);
    applyAuthProxy('tracking', services.tracking);
    applyAuthProxy('bookings', services.bookings);
  }
}