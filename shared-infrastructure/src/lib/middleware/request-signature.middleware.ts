import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RequestSignerService } from '../signing/request-signer.service';

/**
 * Request Signature Validation Middleware
 * Validates inter-service request signatures
 *
 * Checks:
 * - Request has valid X-Signature header
 * - Signature matches calculated value
 * - Timestamp is recent (not replayed)
 * - Nonce is present
 *
 * Skips validation for:
 * - Routes marked as public/external
 * - Development mode (logs warning)
 *
 * Usage in app.module.ts:
 * export class AppModule implements NestModule {
 *   configure(consumer: MiddlewareConsumer) {
 *     consumer
 *       .apply(RequestSignatureMiddleware)
 *       .forRoutes('/internal/*'); // Only validate internal routes
 *   }
 * }
 */
@Injectable()
export class RequestSignatureMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestSignatureMiddleware.name);
  private readonly isDevelopment: boolean;

  constructor(private requestSignerService: RequestSignerService) {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  use(req: Request, res: Response, next: NextFunction) {
    // Skip public routes
    if (this.isPublicRoute(req.path)) {
      return next();
    }

    // Skip in development (with warning)
    if (this.isDevelopment) {
      this.logger.warn(
        `Development mode: skipping request signature validation for ${req.method} ${req.path}`,
      );
      return next();
    }

    // Collect request body for signature verification
    let body = '';

    const chunks: Buffer[] = [];
    const originalWrite = res.write;
    const originalEnd = res.end;

    // Capture request body
    req.on('data', (chunk) => {
      chunks.push(Buffer.from(chunk));
    });

    req.on('end', () => {
      body = Buffer.concat(chunks).toString('utf8');

      // Verify signature
      const headers: Record<string, string> = {};
      Object.keys(req.headers).forEach((key) => {
        const value = req.headers[key];
        if (typeof value === 'string') {
          headers[key.toLowerCase()] = value;
        }
      });

      const isValid = this.requestSignerService.verify(
        headers,
        req.method,
        req.path,
        body,
      );

      if (!isValid) {
        this.logger.warn(
          `Invalid request signature from ${req.ip} for ${req.method} ${req.path}`,
        );

        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid request signature',
        });
      }

      this.logger.debug(
        `Valid request signature from service ${headers['x-service-id']}`,
      );
      next();
    });
  }

  /**
   * Check if route is public (doesn't need signature validation)
   */
  private isPublicRoute(path: string): boolean {
    const publicPaths = [
      '/health',
      '/health/live',
      '/health/ready',
      '/metrics',
      '/auth/login',
      '/auth/register',
    ];

    return publicPaths.some((publicPath) => path.startsWith(publicPath));
  }
}
