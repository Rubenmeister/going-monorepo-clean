import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { ProxyModule } from './proxy/proxy.module';
import { TrackingModule } from './tracking/tracking.module';
import { RbacModule } from './rbac/rbac.module';
// AuditModule temporarily disabled (pending domains-audit-core/application libs)
// import { AuditModule } from './modules/audit/audit.module';
import {
  HttpsMiddleware,
  RequestSignatureMiddleware,
  AuditInterceptor,
  SentryInterceptor,
} from '@going-monorepo-clean/shared-infrastructure';
import { HealthController } from './app/health.controller';

/**
 * API Gateway App Module
 * Main application module that configures:
 * - Authentication (JWT strategy, auth guards)
 * - RBAC (role/permission-based access control)
 * - Security middlewares (HTTPS, request signing)
 * - Rate limiting (throttling)
 * - Proxy and tracking modules
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds window
        limit: 100, // max 100 requests per window
      },
    ]),
    AuthModule,
    RbacModule,
    ProxyModule,
    TrackingModule,
  ],
  controllers: [HealthController],
  providers: [
    // Sentry error tracking
    {
      provide: APP_INTERCEPTOR,
      useClass: SentryInterceptor,
    },
    // AuditInterceptor registered globally - captures all @Audit() decorated endpoints
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  /**
   * Configure middleware
   * Middleware execution order:
   * 1. HttpsMiddleware - Enforce HTTPS, add security headers
   * 2. RequestSignatureMiddleware - Validate inter-service signatures
   * 3. Built-in guards (JWT, Roles, Permissions)
   */
  configure(consumer: MiddlewareConsumer) {
    consumer
      // 1. HTTPS enforcement (redirect HTTP to HTTPS)
      .apply(HttpsMiddleware)
      .forRoutes('*')
      // 2. Request signature validation (inter-service communication)
      .apply(RequestSignatureMiddleware)
      .forRoutes('/internal/*'); // Only validate internal routes
  }
}
