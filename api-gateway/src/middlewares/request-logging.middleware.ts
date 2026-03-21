/**
 * Request Logging Middleware
 * Comprehensive HTTP request/response logging with correlation tracking
 * Enables distributed tracing across microservices
 */

import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuid } from 'uuid';

/**
 * Request context attached to Express request
 * Used for tracking across async operations
 */
export interface RequestContext {
  requestId: string;
  traceId: string;
  startTime: number;
  userId?: string;
  sessionId?: string;
  correlationId?: string;
}

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestLoggingMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    // Generate correlation IDs
    const requestId = (req.headers['x-request-id'] as string) || uuid();
    const traceId = (req.headers['x-trace-id'] as string) || uuid();
    const correlationId =
      (req.headers['x-correlation-id'] as string) || traceId;

    // Attach context to request
    const context: RequestContext = {
      requestId,
      traceId,
      correlationId,
      startTime: Date.now(),
      userId: (req as any).user?.userId,
      sessionId: (req as any).sessionId,
    };

    (req as any).context = context;

    // Set correlation headers on response
    res.setHeader('X-Request-ID', requestId);
    res.setHeader('X-Trace-ID', traceId);
    res.setHeader('X-Correlation-ID', correlationId);

    // Capture response data
    const originalSend = res.send;
    let responseBody = '';
    let responseSize = 0;

    res.send = function (data: any) {
      responseBody = typeof data === 'string' ? data : JSON.stringify(data);
      responseSize = Buffer.byteLength(responseBody);
      return originalSend.call(this, data);
    };

    // Log request start
    const startLog = this.buildRequestLog(req, context);
    this.logger.debug(`[${requestId}] REQUEST: ${startLog}`);

    // Hook on response finish
    res.on('finish', () => {
      const duration = Date.now() - context.startTime;
      const level = this.getLogLevel(res.statusCode);

      const endLog = this.buildResponseLog(
        req,
        res,
        context,
        duration,
        responseSize
      );

      if (level === 'error') {
        this.logger.error(`[${requestId}] RESPONSE: ${endLog}`);
      } else if (level === 'warn') {
        this.logger.warn(`[${requestId}] RESPONSE: ${endLog}`);
      } else {
        this.logger.debug(`[${requestId}] RESPONSE: ${endLog}`);
      }

      // Log to structured logging system if available
      this.recordMetrics(req, res, context, duration);
    });

    // Handle errors before response
    res.on('error', (error) => {
      const duration = Date.now() - context.startTime;
      this.logger.error(`[${requestId}] ERROR: ${error.message}`, error.stack);
      this.recordMetrics(req, res, context, duration, error);
    });

    next();
  }

  private buildRequestLog(req: Request, context: RequestContext): string {
    const headers = this.sanitizeHeaders(req.headers);
    return JSON.stringify({
      method: req.method,
      path: req.path,
      query: req.query,
      headers,
      userId: context.userId,
      ip: this.getClientIp(req),
    });
  }

  private buildResponseLog(
    req: Request,
    res: Response,
    context: RequestContext,
    duration: number,
    responseSize: number
  ): string {
    return JSON.stringify({
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      responseSize: `${responseSize} bytes`,
      timestamp: new Date().toISOString(),
    });
  }

  private sanitizeHeaders(
    headers: Record<string, any>
  ): Record<string, string> {
    const sensitiveHeaders = [
      'authorization',
      'cookie',
      'x-api-key',
      'x-auth-token',
    ];
    const sanitized: Record<string, string> = {};

    for (const [key, value] of Object.entries(headers)) {
      if (sensitiveHeaders.includes(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = typeof value === 'string' ? value : String(value);
      }
    }

    return sanitized;
  }

  private getClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    const realIp = req.headers['x-real-ip'];
    if (typeof realIp === 'string') {
      return realIp;
    }
    return req.socket?.remoteAddress || 'unknown';
  }

  private getLogLevel(statusCode: number): 'debug' | 'warn' | 'error' {
    if (statusCode >= 500) return 'error';
    if (statusCode >= 400) return 'warn';
    return 'debug';
  }

  private recordMetrics(
    req: Request,
    res: Response,
    context: RequestContext,
    duration: number,
    error?: Error
  ) {
    // This could be extended to send metrics to monitoring systems
    // e.g., Prometheus, DataDog, New Relic, etc.

    const tags = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      userId: context.userId,
    };

    // Example: Send to Prometheus
    // prometheus.httpRequestDuration.labels(tags).observe(duration);
    // prometheus.httpRequestTotal.labels(tags).inc();

    if (error) {
      // prometheus.httpRequestErrors.labels(tags).inc();
    }
  }
}

/**
 * Extract request context from request
 * Useful for passing context to downstream services
 */
export function getRequestContext(req: Request): RequestContext | undefined {
  return (req as any).context;
}
