/**
 * Sentry stub - no-op implementation for standalone deployment
 * Real Sentry integration requires @sentry/react package
 */

export function initSentryReact() {
  // No-op: Sentry not configured in this deployment
}

export function captureException(
  error: Error,
  context?: Record<string, unknown>
) {
  console.error('[captureException]', error, context);
}

export function captureMessage(
  message: string,
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info'
) {
  console.log(`[captureMessage][${level}]`, message);
}

export function setUserContext(
  userId: string,
  email?: string,
  username?: string
) {
  // No-op
}

export function clearUserContext() {
  // No-op
}
