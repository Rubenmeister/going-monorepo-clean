import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createProxyMiddleware } from 'http-proxy-middleware';
import * as passport from 'passport'; // Necesario para el middleware de Auth

@Module({})
export class ProxyModule implements NestModule {
  constructor(private readonly configService: ConfigService) {}

  configure(consumer: MiddlewareConsumer) {
    // Lista de microservicios y sus URLs (del .env)
    const services = {
      auth: this.configService.get('USER_AUTH_SERVICE_URL'), // ej. http://localhost:3009
      transport: this.configService.get('TRANSPORT_SERVICE_URL'), // ej. http://localhost:3006
      payments: this.configService.get('PAYMENT_SERVICE_URL'), // ej. http://localhost:3001
      tours: this.configService.get('TOURS_SERVICE_URL'), // ej. http://localhost:3005
      accommodations: this.configService.get('ANFITRIONES_SERVICE_URL'), // ej. http://localhost:3003
      experiences: this.configService.get('EXPERIENCIAS_SERVICE_URL'), // ej. http://localhost:3004
      parcels: this.configService.get('ENVIOS_SERVICE_URL'), // ej. http://localhost:3007
      notifications: this.configService.get('NOTIFICATIONS_SERVICE_URL'), // ej. http://localhost:3008
      tracking: this.configService.get('TRACKING_SERVICE_URL'), // ej. http://localhost:3009
      bookings: this.configService.get('BOOKING_SERVICE_URL'), // ej. http://localhost:3010
    };

    // --- RUTAS PÚBLICAS (ej. login, register) ---
    consumer
      .apply(
        createProxyMiddleware({
          target: services.auth,
          changeOrigin: true,
          pathRewrite: { '^/api/auth': '/' }, // Quita /api/auth
        }),
      )
      .forRoutes('auth'); // Aplica a /api/auth/*

    // --- RUTAS PROTEGIDAS (Todas las demás) ---
    // Aplica el guardia de JWT primero, y luego el proxy
    const applyAuthProxy = (path: string, targetService: string) => {
      consumer
        .apply(
          passport.authenticate('jwt', { session: false }), // 1. Valida el JWT
          createProxyMiddleware({                         // 2. Si es válido, reenvía
            target: targetService,
            changeOrigin: true,
            pathRewrite: { [`^/api/${path}`]: '/' },
          }),
        )
        .forRoutes(path); // Aplica a /api/{path}/*
    };
    
    // Aplica el proxy protegido a cada microservicio
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