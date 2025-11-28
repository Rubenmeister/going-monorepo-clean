import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';
import { Request } from 'express';

interface LogContext {
  service?: string;
  userId?: string;
  requestId?: string;
  method?: string;
  url?: string;
  userAgent?: string;
  ip?: string;
  [key: string]: any;
}

@Injectable()
export class CustomLogger implements LoggerService {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
        winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
          return JSON.stringify({
            timestamp,
            level,
            message,
            service: service || process.env.SERVICE_NAME || 'unknown',
            environment: process.env.NODE_ENV || 'development',
            ...meta,
          });
        })
      ),
      defaultMeta: {
        service: process.env.SERVICE_NAME || 'going-tourism',
      },
      transports: [
        // Console transport for development
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
            winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
              const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
              return `${timestamp} [${service}] ${level}: ${message} ${metaStr}`;
            })
          ),
        }),
        
        // File transport for production
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        }),
        
        new winston.transports.File({
          filename: 'logs/combined.log',
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        }),
      ],
    });

    // Add HTTP transport for centralized logging in production
    if (process.env.NODE_ENV === 'production' && process.env.LOG_ENDPOINT) {
      this.logger.add(
        new winston.transports.Http({
          host: process.env.LOG_HOST,
          port: parseInt(process.env.LOG_PORT || '80'),
          path: process.env.LOG_PATH || '/logs',
        })
      );
    }
  }

  log(message: string, context?: LogContext) {
    this.logger.info(message, context);
  }

  error(message: string, trace?: string, context?: LogContext) {
    this.logger.error(message, { trace, ...context });
  }

  warn(message: string, context?: LogContext) {
    this.logger.warn(message, context);
  }

  debug(message: string, context?: LogContext) {
    this.logger.debug(message, context);
  }

  verbose(message: string, context?: LogContext) {
    this.logger.verbose(message, context);
  }

  // HTTP Request logging
  logRequest(req: Request, res: any, responseTime: number) {
    const context: LogContext = {
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      requestId: req.headers['x-request-id'] as string,
      userId: (req as any).user?.id,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      contentLength: res.get('Content-Length'),
    };

    const message = `${req.method} ${req.url} ${res.statusCode} - ${responseTime}ms`;
    
    if (res.statusCode >= 400) {
      this.error(message, undefined, context);
    } else {
      this.log(message, context);
    }
  }

  // Database operation logging
  logDatabaseOperation(operation: string, table: string, duration: number, context?: LogContext) {
    this.debug(`Database ${operation} on ${table}`, {
      operation,
      table,
      duration: `${duration}ms`,
      ...context,
    });
  }

  // Business logic logging
  logBusinessEvent(event: string, data: any, context?: LogContext) {
    this.log(`Business Event: ${event}`, {
      event,
      data,
      ...context,
    });
  }

  // Security logging
  logSecurityEvent(event: string, severity: 'low' | 'medium' | 'high' | 'critical', context?: LogContext) {
    const message = `Security Event: ${event}`;
    
    switch (severity) {
      case 'critical':
        this.error(message, undefined, { severity, ...context });
        break;
      case 'high':
        this.error(message, undefined, { severity, ...context });
        break;
      case 'medium':
        this.warn(message, { severity, ...context });
        break;
      default:
        this.log(message, { severity, ...context });
    }
  }

  // Performance logging
  logPerformance(operation: string, duration: number, context?: LogContext) {
    const message = `Performance: ${operation} took ${duration}ms`;
    
    if (duration > 5000) { // > 5 seconds
      this.warn(message, { operation, duration, ...context });
    } else if (duration > 1000) { // > 1 second
      this.log(message, { operation, duration, ...context });
    } else {
      this.debug(message, { operation, duration, ...context });
    }
  }
}

// Logging Interceptor
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: CustomLogger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const responseTime = Date.now() - startTime;
        this.logger.logRequest(request, response, responseTime);
      })
    );
  }
}

// Request ID Middleware
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const requestId = req.headers['x-request-id'] as string || uuidv4();
    req.headers['x-request-id'] = requestId;
    res.setHeader('x-request-id', requestId);
    next();
  }
}

// Logger Module
import { Module, Global } from '@nestjs/common';

@Global()
@Module({
  providers: [CustomLogger],
  exports: [CustomLogger],
})
export class LoggerModule {}