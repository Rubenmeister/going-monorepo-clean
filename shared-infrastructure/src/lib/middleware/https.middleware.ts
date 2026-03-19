import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';

/**
 * HTTPS Enforcement Middleware
 * Ensures all traffic is over HTTPS
 *
 * Behavior:
 * - If request is HTTP, redirect to HTTPS with 301 status
 * - If request is HTTPS, proceed normally
 * - Skips localhost/127.0.0.1 (development)
 * - Can be disabled via ENV_HTTPS_ENFORCE config
 *
 * Usage in app.module.ts:
 * export class AppModule implements NestModule {
 *   configure(consumer: MiddlewareConsumer) {
 *     consumer
 *       .apply(HttpsMiddleware)
 *       .forRoutes('*');
 *   }
 * }
 */
@Injectable()
export class HttpsMiddleware implements NestMiddleware {
  private readonly logger = new Logger(HttpsMiddleware.name);
  private readonly enforceHttps: boolean;
  private readonly isDevelopment: boolean;

  constructor(private configService: ConfigService) {
    this.enforceHttps = this.configService.get('HTTPS_ENFORCE', 'true') === 'true';
    this.isDevelopment = this.configService.get('NODE_ENV', 'development') === 'development';
  }

  use(req: Request, res: Response, next: NextFunction) {
    // Skip if HTTPS enforcement is disabled
    if (!this.enforceHttps) {
      return next();
    }

    // Skip if development environment
    if (this.isDevelopment) {
      this.logger.debug(`Development mode: skipping HTTPS enforcement`);
      return next();
    }

    // Skip localhost
    const host = req.hostname || req.get('host') || '';
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
      return next();
    }

    // Check if request is HTTPS
    const protocol = req.protocol || req.get('x-forwarded-proto') || '';

    if (protocol.toLowerCase() !== 'https') {
      // Redirect to HTTPS
      const httpsUrl = `https://${host}${req.originalUrl}`;

      this.logger.warn(
        `HTTP request detected from ${req.ip}. Redirecting to HTTPS: ${httpsUrl}`,
      );

      return res.redirect(301, httpsUrl);
    }

    // Add HTTPS security headers
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');

    next();
  }
}
