/**
 * Crash Reporting Service
 * Integrates with Sentry for real-time error tracking and monitoring
 * Captures unhandled exceptions, user actions, and performance metrics
 */

import * as Sentry from '@sentry/react-native';
import { Platform } from 'react-native';

export interface CrashContext {
  userId?: string;
  sessionId?: string;
  appVersion?: string;
  osVersion?: string;
  [key: string]: any;
}

export interface BreadcrumbData {
  message: string;
  level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
  category?: string;
  data?: Record<string, any>;
}

export class CrashReportingService {
  private initialized = false;
  private context: CrashContext = {};

  /**
   * Initialize Sentry
   */
  initialize(dsn: string, environment: string = 'production'): void {
    if (this.initialized) return;

    try {
      Sentry.init({
        dsn,
        environment,
        tracesSampleRate: 1.0,
        release: `${Platform.OS}-1.0.0`,
        enableAutoSessionTracking: true,
        sessionTrackingIntervalMillis: 30000,
        maxBreadcrumbs: 100,
        // Ignore certain errors
        ignoreErrors: [
          // Ignore network errors in development
          'Network error',
          'timeout',
          'Network request failed',
        ],
      });

      this.initialized = true;
      console.log('✅ Sentry crash reporting initialized');
    } catch (error) {
      console.error('Failed to initialize Sentry:', error);
    }
  }

  /**
   * Set user context
   */
  setUserContext(userId: string, email?: string, username?: string): void {
    if (!this.initialized) return;

    try {
      Sentry.setUser({
        id: userId,
        email,
        username,
      });

      this.context.userId = userId;
    } catch (error) {
      console.error('Failed to set user context:', error);
    }
  }

  /**
   * Set custom context data
   */
  setContext(name: string, data: Record<string, any>): void {
    if (!this.initialized) return;

    try {
      Sentry.setContext(name, data);
      this.context = { ...this.context, ...data };
    } catch (error) {
      console.error('Failed to set context:', error);
    }
  }

  /**
   * Add breadcrumb (user action tracking)
   */
  addBreadcrumb(breadcrumb: BreadcrumbData): void {
    if (!this.initialized) return;

    try {
      Sentry.captureMessage(breadcrumb.message, {
        level: breadcrumb.level || 'info',
        contexts: {
          app: {
            category: breadcrumb.category,
            ...breadcrumb.data,
          },
        },
      });
    } catch (error) {
      console.error('Failed to add breadcrumb:', error);
    }
  }

  /**
   * Capture exception
   */
  captureException(error: Error, context?: Record<string, any>): void {
    if (!this.initialized) return;

    try {
      Sentry.captureException(error, {
        contexts: {
          app: context,
        },
      });

      console.error('Exception captured:', error.message);
    } catch (sentryError) {
      console.error('Failed to capture exception:', sentryError);
    }
  }

  /**
   * Capture message
   */
  captureMessage(
    message: string,
    level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info',
    context?: Record<string, any>
  ): void {
    if (!this.initialized) return;

    try {
      Sentry.captureMessage(message, {
        level,
        contexts: {
          app: context,
        },
      });
    } catch (error) {
      console.error('Failed to capture message:', error);
    }
  }

  /**
   * Set user feedback
   */
  showUserFeedback(error?: Error): void {
    if (!this.initialized) return;

    try {
      Sentry.showUserFeedbackDialog({
        title: "It looks like we're having issues.",
        subtitle: 'Our team has been notified.',
        labelComments: 'What happened?',
        labelEmail: 'Email',
        labelName: 'Name',
        onSubmit: (data) => {
          console.log('User feedback submitted:', data);
        },
      });
    } catch (error) {
      console.error('Failed to show user feedback dialog:', error);
    }
  }

  /**
   * Start performance transaction
   */
  startTransaction(name: string, op: string): Sentry.Transaction | null {
    if (!this.initialized) return null;

    try {
      return Sentry.startTransaction({
        name,
        op,
        sampled: true,
      });
    } catch (error) {
      console.error('Failed to start transaction:', error);
      return null;
    }
  }

  /**
   * Capture performance timing
   */
  captureMetric(name: string, value: number, unit: string = 'ms'): void {
    if (!this.initialized) return;

    try {
      Sentry.captureMessage(`Metric: ${name}=${value}${unit}`, 'info');
    } catch (error) {
      console.error('Failed to capture metric:', error);
    }
  }

  /**
   * Create error boundary wrapper (for React)
   */
  createErrorBoundary(
    FallbackComponent: React.ComponentType<any>
  ): React.ComponentType<any> {
    return Sentry.withErrorBoundary(FallbackComponent, {
      fallback: <FallbackComponent />,
      showDialog: true,
    });
  }

  /**
   * Get current context
   */
  getContext(): CrashContext {
    return { ...this.context };
  }

  /**
   * Clear all context
   */
  clearContext(): void {
    this.context = {};
    if (this.initialized) {
      Sentry.clearBreadcrumbs();
    }
  }

  /**
   * Flush all pending events
   */
  async flush(timeout: number = 2000): Promise<boolean> {
    if (!this.initialized) return false;

    try {
      return await Sentry.flush(timeout);
    } catch (error) {
      console.error('Failed to flush Sentry:', error);
      return false;
    }
  }

  /**
   * Close Sentry client
   */
  async close(): Promise<void> {
    if (!this.initialized) return;

    try {
      await Sentry.close();
      this.initialized = false;
    } catch (error) {
      console.error('Failed to close Sentry:', error);
    }
  }
}

// Export singleton
export const crashReportingService = new CrashReportingService();
