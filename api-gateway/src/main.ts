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
import * as net from 'net';
import * as tls from 'tls';
import { IncomingMessage } from 'http';
import { Socket } from 'net';

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
    // auditoría B1 #21/#22: antes se registraba con global:false y NUNCA se
    // aplicaba per-route (las rutas van por el PROXY, no por handlers Nest con
    // config), así que el rate-limit no protegía nada y el log mentía. Ahora es
    // GLOBAL (el onRequest de fastify corre antes que el middleware del proxy) con
    // `max` DINÁMICO por ruta y key por BUCKET (login/pagos tienen su propio
    // contador por IP, no comparten presupuesto con el browse).
    const GENERAL_MAX = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000', 10);
    const AUTH_MAX = parseInt(process.env.RATE_LIMIT_AUTH_MAX || '5', 10);
    const PAYMENTS_MAX = parseInt(process.env.RATE_LIMIT_PAYMENTS_MAX || '10', 10);
    const bucketOf = (url: string): 'auth' | 'payments' | 'general' => {
      const u = (url || '').split('?')[0];
      if (u.startsWith('/auth/login') || u.startsWith('/auth/corporate/login') ||
          u.startsWith('/auth/register') || u.startsWith('/auth/reset-password') ||
          u.startsWith('/auth/forgot-password')) return 'auth';
      if (u.startsWith('/payments')) return 'payments';
      return 'general';
    };
    // IP REAL del cliente: detrás del GLB, request.ip es la IP del balanceador
    // (todos compartirían un contador y se bloquearían entre sí). El GLB pone la
    // IP del cliente como primer valor de X-Forwarded-For.
    const clientIp = (request: any): string => {
      const xff = request.headers?.['x-forwarded-for'];
      if (typeof xff === 'string' && xff.length) return xff.split(',')[0].trim();
      return request.ip;
    };
    // Store COMPARTIDO en Redis (auditoría B1 — follow-up de #21/#22): sin esto el
    // contador es in-memory POR POD, así que con N pods el límite efectivo es N×.
    // Con el store Redis el límite es global y exacto entre pods. Si REDIS_URL no
    // está o ioredis falla, se degrada a in-memory (sigue protegiendo, por pod).
    let rlRedis: unknown = undefined;
    const rlRedisUrl = process.env.REDIS_URL;
    if (rlRedisUrl) {
      try {
        const { default: Redis } = await import('ioredis');
        rlRedis = new Redis(rlRedisUrl, {
          connectTimeout: 5000,
          maxRetriesPerRequest: 1,
          enableOfflineQueue: false,
          // @fastify/rate-limit recomienda un keyPrefix propio para no colisionar.
          keyPrefix: 'rl:',
        });
      } catch (e) {
        Logger.warn(
          `Rate limit: ioredis no disponible (${(e as Error).message}) — store in-memory por pod`,
          'Security',
        );
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await app.register(fastifyRateLimit as any, {
      global: true,
      ...(rlRedis ? { redis: rlRedis } : {}),
      max: (request: any) => {
        const b = bucketOf(request.url);
        return b === 'auth' ? AUTH_MAX : b === 'payments' ? PAYMENTS_MAX : GENERAL_MAX;
      },
      timeWindow: '1 minute',
      // Key por (ip-real + bucket) → cada bucket tiene su propio contador por cliente.
      keyGenerator: (request: any) => `${clientIp(request)}:${bucketOf(request.url)}`,
      errorResponseBuilder: (_request: any, context: any) => ({
        statusCode: 429,
        message: 'Too many requests, please try again later',
        retryAfter: context.after,
      }),
      skipOnError: false,
    });

    Logger.log(
      `Rate limiting ACTIVO (global, store=${rlRedis ? 'redis-compartido' : 'in-memory-por-pod'}): ` +
      `${GENERAL_MAX}/min general, ${AUTH_MAX}/min auth, ${PAYMENTS_MAX}/min pagos (por IP y bucket)`,
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
      // Store original URL on raw IncomingMessage before middie strips it in middleware
      (request as any).raw.originalUrl = (request as any).url;
      done();
    }
  );

  // ── CORS GLOBAL HOOK ──────────────────────────────────────
  // Fallback que garantiza Access-Control-Allow-Origin en TODAS las
  // respuestas (incluyendo 401 de passport, 429 de rate-limit, 500/503
  // genéricos, etc.). Sin esto, errores de cualquier capa rompen el flujo
  // con "Failed to fetch" desde el browser porque no traen CORS.
  fastifyInstance.addHook(
    'onSend',
    (request: any, reply: any, _payload: any, done: () => void) => {
      const origin = request.headers?.origin;
      const allowed = (process.env.CORS_ORIGINS ?? '')
        .split(',')
        .map((o: string) => o.trim())
        .filter(Boolean);
      if (origin && allowed.includes(origin) && !reply.getHeader('access-control-allow-origin')) {
        reply.header('Access-Control-Allow-Origin', origin);
        reply.header('Vary', 'Origin');
        reply.header('Access-Control-Allow-Credentials', 'true');
      }
      done();
    }
  );
  // Copy parsed body to raw IncomingMessage so proxy middleware can read req.body
  fastifyInstance.addHook(
    'preHandler',
    (request: any, _reply: unknown, done: () => void) => {
      if (request.body !== undefined) {
        request.raw.body = request.body;
      }
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
    'http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003,http://localhost:4200,https://corporate.goingec.com,https://empresas.goingec.com'
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

  // ── WS UPGRADE PROXY: /voice/ws → customer-support-service ────────────
  // El proxy HTTP de proxy.module.ts NO maneja el handshake WS (HTTP upgrade
  // requiere control raw del socket TCP, no funciona en middleware Fastify).
  // Acá enganchamos un listener al `upgrade` event del httpServer subyacente
  // y abrimos un socket TLS/TCP al upstream, piping bidi una vez negociado.
  //
  // Por qué no http-proxy / http-proxy-middleware: probado en prod hace meses
  // (ver comment en proxy.module.ts) — hangs silentes en Cloud Run con HTTP/2.
  // El pipe raw es lo que mejor funciona en este stack.
  const customerSupportUrl = process.env.CUSTOMER_SUPPORT_SERVICE_URL;
  if (customerSupportUrl) {
    const wsLogger = new Logger('VoiceWsProxy');
    const target = new URL(customerSupportUrl);
    const isHttps = target.protocol === 'https:';
    const upstreamPort = target.port
      ? parseInt(target.port, 10)
      : (isHttps ? 443 : 80);
    const upstreamHost = target.hostname;

    const httpServer = (fastifyInstance as any).server;
    httpServer.on('upgrade', (req: IncomingMessage, clientSocket: Socket, head: Buffer) => {
      const reqUrl = new URL(req.url || '/', 'http://localhost');
      // SOLO interceptamos /voice/ws. Cualquier otro upgrade lo dejamos
      // pasar al siguiente handler (si Fastify registra alguno en el futuro)
      // o destruimos el socket si no hay nadie escuchando.
      if (reqUrl.pathname !== '/voice/ws') {
        // No other upgrade handlers registered → reject cleanly
        clientSocket.write('HTTP/1.1 404 Not Found\r\nContent-Length: 0\r\n\r\n');
        clientSocket.destroy();
        return;
      }

      wsLogger.log(`upgrade ${req.url} -> ${target.host} from ${req.socket.remoteAddress}`);

      const upstreamSocket = isHttps
        ? tls.connect({
            host: upstreamHost,
            port: upstreamPort,
            servername: upstreamHost,
            ALPNProtocols: ['http/1.1'],
          })
        : net.connect({ host: upstreamHost, port: upstreamPort });

      const onUpstreamReady = () => {
        // Reconstruir request-line + headers preservando todo lo que mandó el
        // cliente (Sec-WebSocket-Key, Sec-WebSocket-Version, Sec-WebSocket-
        // Protocol, Origin, etc.) excepto el Host que apunta al api.goingec
        // y necesita ser el del upstream para que Cloud Run rutee.
        const lines: string[] = [`${req.method} ${req.url} HTTP/1.1`];
        for (const [name, value] of Object.entries(req.headers)) {
          if (!name || value === undefined) continue;
          if (name.toLowerCase() === 'host') continue;
          if (Array.isArray(value)) {
            for (const v of value) lines.push(`${name}: ${v}`);
          } else {
            lines.push(`${name}: ${value}`);
          }
        }
        lines.push(`Host: ${target.host}`);
        upstreamSocket.write(lines.join('\r\n') + '\r\n\r\n');
        // Cualquier byte recibido tras los headers (improbable en handshake
        // WS, pero posible) lo reenviamos al upstream.
        if (head && head.length > 0) upstreamSocket.write(head);

        // Pipe bidireccional. A partir de acá Cloud Run responde con
        // 101 Switching Protocols y el cliente ↔ customer-support fluyen
        // frames WS directamente, transparente para nosotros.
        upstreamSocket.pipe(clientSocket);
        clientSocket.pipe(upstreamSocket);
      };

      if (isHttps) upstreamSocket.once('secureConnect', onUpstreamReady);
      else upstreamSocket.once('connect', onUpstreamReady);

      upstreamSocket.on('error', (err: Error) => {
        wsLogger.error(`upstream WS error: ${err.message}`);
        try {
          clientSocket.write('HTTP/1.1 502 Bad Gateway\r\nContent-Length: 0\r\n\r\n');
        } catch { /* socket may already be torn down */ }
        try { clientSocket.destroy(); } catch { /* ignore */ }
      });
      clientSocket.on('error', (err: Error) => {
        wsLogger.warn(`client WS error: ${err.message}`);
        try { upstreamSocket.destroy(); } catch { /* ignore */ }
      });
    });

    Logger.log(
      `🎙️ WS proxy /voice/ws → ${target.href}`,
      'Bootstrap'
    );
  } else {
    Logger.warn(
      `WS proxy /voice/ws DISABLED — CUSTOMER_SUPPORT_SERVICE_URL no configurada`,
      'Bootstrap'
    );
  }

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
