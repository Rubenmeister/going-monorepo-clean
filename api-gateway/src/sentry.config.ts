import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

export function initSentry() {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const sentryDsn = process.env.SENTRY_DSN;

  if (!sentryDsn && !isDevelopment) {
    console.warn('[Sentry] SENTRY_DSN not configured in production');
  }

  Sentry.init({
    dsn: sentryDsn,
    environment: process.env.NODE_ENV || 'development',
    integrations: [
      nodeProfilingIntegration(),
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.OnUncaughtException(),
      new Sentry.Integrations.OnUnhandledRejection(),
    ],
    // Performance Monitoring
    tracesSampleRate: isDevelopment ? 1.0 : 0.1,
    profilesSampleRate: isDevelopment ? 1.0 : 0.1,
    // Release tracking
    release: process.env.VERSION || '1.0.0',
    // Capture breadcrumbs
    maxBreadcrumbs: 100,
    // Filter sensitive data
    beforeSend: (event) => {
      if (event.request?.url?.includes('/health')) {
        return null; // Don't send health check errors to Sentry
      }
      return event;
    },
  });

  console.log(
    '[Sentry] Initialized' +
      (sentryDsn
        ? ` (DSN: ${sentryDsn.split('@')[1]?.split('/')[0] || '***'})`
        : ' (development mode)')
  );
}

export function createSentryErrorHandler() {
  return Sentry.Handlers.errorHandler();
}

export function createSentryRequestHandler() {
  return Sentry.Handlers.requestHandler();
}
