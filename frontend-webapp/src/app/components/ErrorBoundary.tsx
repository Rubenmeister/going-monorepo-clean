'use client';

import React, { ReactNode } from 'react';
import { useUIStore } from '@going-monorepo-clean/frontend-stores';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Error Boundary component for catching render errors
 * Provides error recovery UI and error tracking
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to error tracking service (Sentry, LogRocket, etc.)
    console.error('[ErrorBoundary] Error caught:', error, errorInfo);

    // Update state with error info
    this.setState({ errorInfo });

    // Skip toast for React hydration errors — these are dev-only noise
    // caused by browser extensions or SSR/client mismatch, not real user errors.
    const isHydrationError =
      error.message?.includes('Hydration') ||
      error.message?.includes('hydrat') ||
      error.message?.includes('Text content does not match') ||
      error.message?.includes('server-rendered HTML');

    if (!isHydrationError) {
      // Dispatch to UI store for notification
      const { addNotification } = useUIStore.getState();
      addNotification({
        message:
          'An unexpected error occurred. Please try refreshing the page.',
        type: 'error',
        duration: 10000,
      });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error!, this.handleReset);
      }

      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Default error fallback UI
 */
interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  onReset: () => void;
}

function ErrorFallback({ error, errorInfo, onReset }: ErrorFallbackProps) {
  const isDev = process.env.NODE_ENV === 'development';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 space-y-6">
        {/* Error Icon */}
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-6 h-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>

        {/* Error Message */}
        <div className="text-center space-y-2">
          <h1 className="text-xl font-semibold text-gray-900">
            Something went wrong
          </h1>
          <p className="text-gray-600">
            An unexpected error occurred. Please try refreshing the page or
            contact support if the problem persists.
          </p>
        </div>

        {/* Error Details (Development Only) */}
        {isDev && error && (
          <div className="bg-gray-100 rounded-md p-4 space-y-2 max-h-32 overflow-auto">
            <p className="text-xs font-semibold text-gray-700">
              Error Details:
            </p>
            <p className="text-xs text-gray-600 font-mono">{error.message}</p>
            {errorInfo && (
              <p className="text-xs text-gray-600 font-mono whitespace-pre-wrap">
                {errorInfo.componentStack}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={onReset}
            className="w-full px-4 py-2 bg-[#ff4c41] text-white rounded-md hover:bg-[#e63a2f] transition-colors font-medium"
          >
            Try Again
          </button>
          <button
            onClick={() => {
              // Clear any state and redirect to home
              window.location.href = '/';
            }}
            className="w-full px-4 py-2 bg-gray-100 text-gray-900 rounded-md hover:bg-gray-200 transition-colors font-medium"
          >
            Go to Home
          </button>
        </div>
      </div>
    </div>
  );
}
