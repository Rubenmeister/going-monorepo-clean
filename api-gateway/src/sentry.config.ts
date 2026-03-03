import * as Sentry from '@sentry/node';

export function initSentry() {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const sentryDsn = process.env.SENTRY_DSN;

  if (!sentryDsn && !isDevelopment) {
    console.warn('[Sentry] SENTRY_DSN not configured in production');
  }

  if (!sentryDsn) {
    return; // Skip initialization without DSN
  }

  Sentry.init({
    dsn: sentryDsn,
    environment: process.env.NODE_ENV || 'development',
    integrations: [
      // Sentry v10+ API: use httpIntegration() instead of deprecated Sentry.Integrations.Http
      Sentry.httpIntegration({ tracing: true }),
    ],
    // Performance Monitoring
    tracesSampleRate: isDevelopment ? 1.0 : 0.1,
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
  // Sentry v10+ API: expressErrorHandler() replaces Handlers.errorHandler()
  const sentryAny = Sentry as any;
  if (typeof sentryAny.expressErrorHandler === 'function') {
    return sentryAny.expressErrorHandler();
  }
  // Fallback: pass-through error middleware
  return (err: any, req: any, res: any, next: any) => next(err);
}

export function createSentryRequestHandler() {
  // Sentry v10+ handles request tracking automatically via httpIntegration
  return (req: any, res: any, next: any) => next();
}
