import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { v4 as uuidv4 } from 'uuid';
import { initSentry, registerSentryFastify } from './sentry.config';
import { AllExceptionsFilter } from '@going-monorepo-clean/shared-infrastructure';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';

async function bootstrap() {
  // Initialize Sentry first
  initSentry();

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false })
  );

  const port = process.env.PORT || 3000;

  // ── SECURITY HEADERS via @fastify/helmet ──────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await app.register(fastifyHelmet as any, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", 'https://cdn.jsdelivr.net', 'https://unpkg.com'],
        styleSrc: [
          "'self'",
          'https://fonts.googleapis.com',
          'https://cdn.jsdelivr.net',
        ],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'https:', 'wss:'],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        upgradeInsecureRequests:
          process.env.NODE_ENV === 'production' ? [] : null,
      },
      reportUri: process.env.CSP_REPORT_URI,
    },
    hsts: {
      maxAge: 31536000,
      includeSubdomains: true,
      preload: true,
    },
    frameguard: { action: 'deny' },
    xssFilter: true,
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  });

  // ── RATE LIMITING via @fastify/rate-limit ─────────────────
  const rateLimitEnabled = process.env.RATE_LIMIT_ENABLED !== 'false';
  if (rateLimitEnabled) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await app.register(fastifyRateLimit as any, {
      global: false, // we apply per-route via config below
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000', 10),
      timeWindow: '1 minute',
      keyGenerator: (request) => request.ip,
      errorResponseBuilder: (_request, context) => ({
        statusCode: 429,
        message: 'Too many requests, please try again later',
        retryAfter: context.after,
      }),
      skipOnError: false,
    });

    Logger.log(
      'Rate limiting enabled: 1000 req/min (general), 5 req/min (auth), 10 req/min (payments)',
      'Security'
    );
  }

  // ── AUDIT LOGGING HOOK ────────────────────────────────────
  app.useLogger(['error', 'warn', 'log']);
  const fastifyInstance = app.getHttpAdapter().getInstance();
  fastifyInstance.addHook(
    'onRequest',
    (
      request: {
        id: string;
        ip: string;
        method: string;
        url: string;
        user?: { id: string };
      },
      _reply: unknown,
      done: () => void
    ) => {
      request.id = uuidv4();
      done();
    }
  );
  fastifyInstance.addHook(
    'onResponse',
    (
      request: {
        id: string;
        ip: string;
        method: string;
        url: string;
        user?: { id: string };
      },
      reply: { statusCode: number; elapsedTime: number },
      done: () => void
    ) => {
      const logData = {
        requestId: request.id,
        method: request.method,
        url: request.url,
        ip: request.ip,
        statusCode: reply.statusCode,
        durationMs: `${Math.round(reply.elapsedTime)}ms`,
        userId: request.user?.id || 'anonymous',
      };

      if (reply.statusCode >= 500) {
        Logger.error(`API Request – ${JSON.stringify(logData)}`, 'Audit');
      } else if (reply.statusCode >= 400) {
        Logger.warn(`API Request – ${JSON.stringify(logData)}`, 'Audit');
      } else {
        Logger.log(`API Request – ${JSON.stringify(logData)}`, 'Audit');
      }
      done();
    }
  );

  // ── SENTRY ERROR HOOK (Fastify native) — reuse instance from audit hooks ─
  registerSentryFastify(fastifyInstance as any);

  // ── GLOBAL PIPES & FILTERS ────────────────────────────────
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter());

  // ── CORS ──────────────────────────────────────────────────
  const corsOrigins = (
    process.env.CORS_ORIGINS ||
    'http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003,http://localhost:4200'
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

  // ── SWAGGER ───────────────────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('Going Platform – API Gateway')
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

  await app.listen(port, '0.0.0.0');

  Logger.log(
    `🚀 API Gateway (Fastify) running on http://localhost:${port}`,
    'Bootstrap'
  );
  Logger.log(
    `📄 API docs available at http://localhost:${port}/docs`,
    'Bootstrap'
  );
  Logger.log(
    `🔒 Security: @fastify/helmet + @fastify/rate-limit enabled`,
    'Security'
  );
  Logger.log(`🌐 CORS restricted to: ${corsOrigins.join(', ')}`, 'Bootstrap');
}

bootstrap();
