import * as Sentry from '@sentry/react';

/**
 * Initialize Sentry for React frontend error tracking
 * Should be called as early as possible in the app lifecycle
 */
export function initSentryReact() {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

  if (!sentryDsn) {
    if (!isDevelopment) {
      console.warn('[Sentry] NEXT_PUBLIC_SENTRY_DSN not configured');
    }
    return;
  }

  Sentry.init({
    dsn: sentryDsn,
    environment: process.env.NODE_ENV || 'development',
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
      Sentry.captureConsoleIntegration({
        levels: ['error', 'warn'],
      }),
    ],
    // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: isDevelopment ? 1.0 : 0.1,
    // Capture Replay for 10% of all sessions,
    // plus, capture 100% of sessions with an error
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    // Release tracking
    release: process.env.NEXT_PUBLIC_VERSION || '1.0.0',
    // Before send hook to filter sensitive data
    beforeSend: (event) => {
      // Don't send health check or health monitoring requests
      if (event.request?.url?.includes('/health')) {
        return null;
      }
      // Filter out specific errors we don't want to track
      if (event.exception?.values?.[0]?.value?.includes('Network error')) {
        return null;
      }
      return event;
    },
  });

  console.log(
    '[Sentry React] Initialized' +
      (sentryDsn
        ? ` (DSN: ${sentryDsn.split('@')[1]?.split('/')[0] || '***'})`
        : '')
  );
}

/**
 * Capture an exception manually
 */
export function captureException(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    contexts: {
      custom: context,
    },
  });
}

/**
 * Capture a message
 */
export function captureMessage(
  message: string,
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info'
) {
  Sentry.captureMessage(message, level);
}

/**
 * Set user context for error tracking
 */
export function setUserContext(
  userId: string,
  email?: string,
  username?: string
) {
  Sentry.setUser({
    id: userId,
    email,
    username,
  });
}

/**
 * Clear user context
 */
export function clearUserContext() {
  Sentry.setUser(null);
}
