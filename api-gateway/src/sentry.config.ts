import * as Sentry from '@sentry/node';
import type { FastifyInstance } from 'fastify';

export function initSentry() {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const sentryDsn = process.env.SENTRY_DSN;

  if (!sentryDsn && !isDevelopment) {
    console.warn('[Sentry] SENTRY_DSN not configured in production');
  }

  if (!sentryDsn) {
    return;
  }

  Sentry.init({
    dsn: sentryDsn,
    environment: process.env.NODE_ENV || 'development',
    integrations: [Sentry.httpIntegration()],
    tracesSampleRate: isDevelopment ? 1.0 : 0.1,
    release: process.env.VERSION || '1.0.0',
    maxBreadcrumbs: 100,
    beforeSend: (event) => {
      if (event.request?.url?.includes('/health')) {
        return null;
      }
      return event;
    },
  });

  console.log(
    '[Sentry] Initialized for Fastify' +
      (sentryDsn
        ? ` (env: ${sentryDsn.split('@')[1]?.split('/')[0] || '***'})`
        : ' (development mode)')
  );
}

/**
 * Register Sentry error capturing as a Fastify plugin hook.
 * This replaces the old Express errorHandler middleware.
 */
export function registerSentryFastify(fastify: FastifyInstance) {
  if (!process.env.SENTRY_DSN) return;

  fastify.addHook('onError', (_request, _reply, error, done) => {
    Sentry.captureException(error);
    done();
  });
}

/**
 * @deprecated Use registerSentryFastify(fastifyInstance) instead.
 * Kept for backward compat — returns a no-op for any code still calling this.
 */
export function createSentryErrorHandler() {
  return (_err: unknown, _req: unknown, _res: unknown, next: () => void) =>
    next?.();
}
