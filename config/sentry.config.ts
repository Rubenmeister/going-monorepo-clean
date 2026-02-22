/**
 * Sentry Error Tracking & Performance Monitoring Configuration
 * Integrated across all Going Platform microservices
 *
 * Features:
 * - Real-time error tracking
 * - Performance monitoring (APM)
 * - Session replay
 * - User feedback
 * - Alert rules & notifications
 */

import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

export interface SentryConfig {
  dsn: string;
  environment: string;
  release: string;
  tracesSampleRate: number;
  profilesSampleRate: number;
  enablePerformanceMonitoring: boolean;
  enableSessionReplays: boolean;
  enableUserFeedback: boolean;
}

/**
 * Initialize Sentry for microservices
 */
export function initializeSentry(config: SentryConfig): void {
  Sentry.init({
    dsn: config.dsn,
    environment: config.environment,
    release: config.release,

    // Performance Monitoring
    tracesSampleRate: config.tracesSampleRate,
    enableTracing: config.enablePerformanceMonitoring,

    // Profiling
    profilesSampleRate: config.profilesSampleRate,
    integrations: [new ProfilingIntegration()],

    // Session Management
    maxBreadcrumbs: 50,
    attachStacktrace: true,
    maxValueLength: 1000,

    // Filtering
    denyUrls: [
      /health|ping|status/i, // Health check endpoints
      /favicon.ico/,
      /socket.io/,
    ],

    // Error Filtering
    beforeSend(event, hint) {
      // Ignore specific error types
      if (hint.originalException && hint.originalException instanceof Error) {
        const message = hint.originalException.message;
        if (message.includes('ECONNREFUSED')) {
          return null; // Ignore connection refused
        }
        if (message.includes('ENOTFOUND')) {
          return null; // Ignore DNS resolution errors
        }
      }

      // Add custom fingerprinting
      if (event.exception) {
        event.fingerprint = [
          '{{ default }}',
          event.exception[0].value || 'unknown',
        ];
      }

      return event;
    },

    // Release tracking
    _experiments: {
      enableWindowUnload: true,
    },
  });
}

/**
 * Sentry Alert Rules Configuration
 */
export const SENTRY_ALERT_RULES = {
  // Critical Alerts
  PAYMENT_SERVICE_ERROR: {
    name: 'Payment Service Error Rate >5%',
    threshold: 5,
    window: '5m',
    projects: ['payment-service'],
    actions: ['email', 'slack', 'pagerduty'],
    severity: 'critical',
  },

  HIGH_ERROR_RATE: {
    name: 'High Error Rate (>10%)',
    threshold: 10,
    window: '5m',
    projects: ['*'],
    actions: ['slack'],
    severity: 'high',
  },

  UNIQUE_USERS_AFFECTED: {
    name: 'Unique Users Affected >100',
    threshold: 100,
    window: '1h',
    projects: ['*'],
    actions: ['email', 'slack'],
    severity: 'high',
  },

  DATABASE_CONNECTION_ERROR: {
    name: 'Database Connection Errors',
    threshold: 50,
    window: '5m',
    projects: ['*'],
    actions: ['slack', 'pagerduty'],
    severity: 'critical',
  },

  HIGH_P99_LATENCY: {
    name: 'P99 Latency >1000ms',
    threshold: 1000,
    window: '5m',
    projects: ['api-gateway', 'user-auth-service'],
    actions: ['slack'],
    severity: 'high',
  },

  MEMORY_LEAK_DETECTED: {
    name: 'Potential Memory Leak',
    threshold: 500, // MB
    window: '30m',
    projects: ['*'],
    actions: ['slack', 'email'],
    severity: 'high',
  },
};

/**
 * Performance Monitoring Thresholds
 */
export const PERFORMANCE_THRESHOLDS = {
  // Transaction types and acceptable latency
  API_ENDPOINT: {
    name: 'API Endpoint',
    slowThreshold: 500, // ms
    errorThreshold: 100, // ms
  },

  DATABASE_QUERY: {
    name: 'Database Query',
    slowThreshold: 200, // ms
    errorThreshold: 1000, // ms
  },

  EXTERNAL_API_CALL: {
    name: 'External API Call',
    slowThreshold: 2000, // ms
    errorThreshold: 5000, // ms
  },

  CACHE_OPERATION: {
    name: 'Cache Operation',
    slowThreshold: 50, // ms
    errorThreshold: 500, // ms
  },
};

/**
 * Service-specific Sentry DSNs
 * Each service has its own project in Sentry for better organization
 */
export const SERVICE_SENTRY_DSNS: Record<string, string> = {
  // Core Services
  'api-gateway': process.env.SENTRY_DSN_API_GATEWAY || '',
  'user-auth-service': process.env.SENTRY_DSN_USER_AUTH || '',
  'booking-service': process.env.SENTRY_DSN_BOOKING || '',

  // Business Services
  'payment-service': process.env.SENTRY_DSN_PAYMENT || '',
  'transport-service': process.env.SENTRY_DSN_TRANSPORT || '',
  'notifications-service': process.env.SENTRY_DSN_NOTIFICATIONS || '',
  'tracking-service': process.env.SENTRY_DSN_TRACKING || '',

  // Analytics & Reporting
  'analytics-service': process.env.SENTRY_DSN_ANALYTICS || '',
  'ratings-service': process.env.SENTRY_DSN_RATINGS || '',
  'reporting-service': process.env.SENTRY_DSN_REPORTING || '',

  // Advanced Features
  'voice-service': process.env.SENTRY_DSN_VOICE || '',
  'ar-service': process.env.SENTRY_DSN_AR || '',
  'ml-service': process.env.SENTRY_DSN_ML || '',
  'blockchain-service': process.env.SENTRY_DSN_BLOCKCHAIN || '',
  'iot-service': process.env.SENTRY_DSN_IOT || '',

  // Admin & Operations
  'admin-service': process.env.SENTRY_DSN_ADMIN || '',
  'billing-service': process.env.SENTRY_DSN_BILLING || '',
};

/**
 * Middleware for Express to integrate with Sentry
 */
export function sentryErrorHandler() {
  return Sentry.Handlers.errorHandler();
}

export function sentryRequestHandler() {
  return Sentry.Handlers.requestHandler();
}

/**
 * Capture custom errors with context
 */
export function captureServiceError(
  serviceName: string,
  error: Error,
  context: Record<string, any>
): void {
  Sentry.captureException(error, {
    tags: {
      service: serviceName,
      type: 'service_error',
    },
    contexts: {
      service: context,
    },
  });
}

/**
 * Monitor transaction/operation performance
 */
export function startTransaction(
  name: string,
  op: string
): Sentry.Transaction | null {
  return Sentry.startTransaction({
    name,
    op,
    description: `${op} - ${name}`,
  });
}

/**
 * End transaction and report metrics
 */
export function endTransaction(transaction: Sentry.Transaction | null): void {
  if (transaction) {
    transaction.finish();
  }
}

/**
 * Report custom metrics
 */
export function reportMetric(
  name: string,
  value: number,
  unit: string = 'none'
): void {
  Sentry.captureMessage(name, {
    level: 'info',
    contexts: {
      metric: {
        value,
        unit,
      },
    },
  });
}

/**
 * Set user context for better tracking
 */
export function setSentryUser(userId: string, email?: string): void {
  Sentry.setUser({
    id: userId,
    email: email || 'unknown',
  });
}

/**
 * Clear user context on logout
 */
export function clearSentryUser(): void {
  Sentry.setUser(null);
}

/**
 * Sentry Environment Configuration
 */
export const SENTRY_ENV_CONFIG = {
  development: {
    tracesSampleRate: 1.0, // 100% in dev
    profilesSampleRate: 1.0,
    enablePerformanceMonitoring: true,
    enableSessionReplays: false,
    enableUserFeedback: false,
  },

  staging: {
    tracesSampleRate: 0.5, // 50% in staging
    profilesSampleRate: 0.5,
    enablePerformanceMonitoring: true,
    enableSessionReplays: true,
    enableUserFeedback: true,
  },

  production: {
    tracesSampleRate: 0.1, // 10% in production
    profilesSampleRate: 0.1,
    enablePerformanceMonitoring: true,
    enableSessionReplays: false,
    enableUserFeedback: true,
  },
};

export default {
  initializeSentry,
  sentryErrorHandler,
  sentryRequestHandler,
  captureServiceError,
  startTransaction,
  endTransaction,
  reportMetric,
  setSentryUser,
  clearSentryUser,
  SENTRY_ALERT_RULES,
  PERFORMANCE_THRESHOLDS,
  SERVICE_SENTRY_DSNS,
};
