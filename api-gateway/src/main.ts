import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';
import { initSentry, createSentryErrorHandler } from './sentry.config';
import { AllExceptionsFilter } from '@going-monorepo-clean/shared-infrastructure';

// Generate nonce for CSP
function generateNonce(): string {
  return Buffer.from(uuidv4()).toString('base64');
}

// Rate limiting configurations
const createRateLimiter = (
  windowMs: number,
  max: number,
  keyGenerator?: (req: Request) => string
) => {
  return rateLimit({
    windowMs,
    max,
    keyGenerator: keyGenerator || ((req: Request) => req.ip || 'unknown'),
    handler: (req: Request, res: Response) => {
      Logger.warn(
        `Rate limit exceeded for ${req.ip}: ${req.method} ${req.path}`,
        'RateLimit'
      );
      res.status(429).json({
        statusCode: 429,
        message: 'Too many requests, please try again later',
        retryAfter: req.rateLimit?.resetTime,
      });
    },
    skip: (req: Request) => {
      // Skip rate limiting for health checks
      return req.path === '/health' || req.path === '/ready';
    },
  });
};

async function bootstrap() {
  // Initialize Sentry first
  initSentry();

  const app = await NestFactory.create(AppModule);

  const port = process.env.PORT || 3000;

  // AUDIT LOGGING MIDDLEWARE
  app.use((req: Request, res: Response, next: NextFunction) => {
    const requestId = uuidv4();
    const start = Date.now();
    const auditLog = {
      requestId,
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      userId: (req as any).user?.id || 'anonymous',
    };

    res.on('finish', () => {
      const duration = Date.now() - start;
      const logData = {
        ...auditLog,
        statusCode: res.statusCode,
        duration,
        durationMs: `${duration}ms`,
      };

      // Log based on status code
      if (res.statusCode >= 500) {
        Logger.error(`API Request - ${JSON.stringify(logData)}`, 'Audit');
      } else if (res.statusCode >= 400) {
        Logger.warn(`API Request - ${JSON.stringify(logData)}`, 'Audit');
      } else {
        Logger.log(`API Request - ${JSON.stringify(logData)}`, 'Audit');
      }
    });

    // Add request ID to response headers for tracing
    res.setHeader('X-Request-ID', requestId);
    next();
  });

  // RATE LIMITING
  const rateLimitEnabled = process.env.RATE_LIMIT_ENABLED !== 'false';
  if (rateLimitEnabled) {
    // General API rate limiter: 1000 requests per minute per IP
    const generalLimiter = createRateLimiter(
      60 * 1000, // 1 minute window
      parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000', 10)
    );
    app.use('/api/', generalLimiter);

    // Stricter limit for auth endpoints: 5 requests per minute per IP
    const authLimiter = createRateLimiter(60 * 1000, 5);
    app.use('/api/auth/', authLimiter);
    app.use('/api/login', authLimiter);
    app.use('/api/register', authLimiter);

    // Stricter limit for payment endpoints: 10 requests per minute per IP
    const paymentLimiter = createRateLimiter(60 * 1000, 10);
    app.use('/api/payments/', paymentLimiter);

    Logger.log(
      'Rate limiting enabled: 1000 req/min (general), 5 req/min (auth), 10 req/min (payments)',
      'Security'
    );
  }

  // SECURITY HEADERS WITH PROPER CSP (NO unsafe-inline)
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Generate nonce for this request
    const nonce = generateNonce();
    (req as any).cspNonce = nonce;

    // Apply Helmet with proper CSP (no unsafe-inline)
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            // Use nonce for inline scripts
            `'nonce-${nonce}'`,
            // Only trusted CDNs if needed
            'https://cdn.jsdelivr.net',
            'https://unpkg.com',
          ],
          styleSrc: [
            "'self'",
            `'nonce-${nonce}'`,
            'https://fonts.googleapis.com',
            'https://cdn.jsdelivr.net',
          ],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: [
            "'self'",
            'https:',
            'wss:', // For WebSocket connections
          ],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          upgradeInsecureRequests:
            process.env.NODE_ENV === 'production' ? [] : undefined,
        },
        reportUri: process.env.CSP_REPORT_URI,
      },
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
      frameguard: { action: 'deny' },
      xssFilter: true,
      noSniff: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      permittedCrossDomainPolicies: false,
    })(req, res, next);
  });

  // Sentry error handler
  app.use(createSentryErrorHandler());

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter());

  // CORS for frontend clients - use specific origins from environment
  const corsOrigins = (
    process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3001'
  )
    .split(',')
    .map((o) => o.trim());

  app.enableCors({
    origin: corsOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders:
      'Content-Type, Authorization, X-Requested-With, X-Request-ID',
    exposedHeaders:
      'X-Request-ID, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset',
    credentials: true,
    maxAge: 3600,
  });

  // Swagger/API Documentation
  const config = new DocumentBuilder()
    .setTitle('Going Platform - API Gateway')
    .setDescription('Central entry point routing to all Going microservices')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints (public)')
    .addTag('transport', 'Transportation services')
    .addTag('bookings', 'Booking management')
    .addTag('payments', 'Payment processing')
    .addTag('tours', 'Tours management')
    .addTag('accommodations', 'Accommodations management')
    .addTag('experiences', 'Experiences management')
    .addTag('parcels', 'Parcel shipping')
    .addTag('notifications', 'Notification delivery')
    .addTag('tracking', 'Real-time tracking')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(port);
  Logger.log(`🚀 API Gateway running on http://localhost:${port}`, 'Bootstrap');
  Logger.log(
    `📄 API docs available at http://localhost:${port}/docs`,
    'Bootstrap'
  );
  Logger.log(
    `🔒 Security: Helmet enabled (proper CSP), CORS restricted to: ${corsOrigins.join(
      ', '
    )}`,
    'Bootstrap'
  );
  Logger.log(
    `📊 Rate limiting: ${rateLimitEnabled ? 'ENABLED' : 'DISABLED'}`,
    'Bootstrap'
  );
}

bootstrap();
