/**
 * ErrorState component - Display when an error occurred
 */

import React from 'react';

interface ErrorStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  error?: Error | string;
  fullHeight?: boolean;
}

/**
 * Error state component for error scenarios
 * @example
 * <ErrorState
 *   title="Something went wrong"
 *   description="Please try again later"
 *   action={<Button onClick={handleRetry}>Retry</Button>}
 * />
 */
export function ErrorState({
  title = 'Something went wrong',
  description = 'An unexpected error occurred. Please try again.',
  action,
  error,
  fullHeight = false,
}: ErrorStateProps) {
  return (
    <div
      className={`
        flex flex-col items-center justify-center
        ${fullHeight ? 'h-full' : 'py-12 px-4'}
        text-center
      `}
    >
      <div className="text-5xl mb-4">⚠️</div>

      <h3 className="text-lg font-semibold text-red-900 mb-2">{title}</h3>

      <p className="text-gray-600 mb-6 max-w-sm">{description}</p>

      {error && (
        <details className="mb-6 text-left text-sm text-gray-500">
          <summary className="cursor-pointer font-semibold text-red-700 hover:text-red-800">
            Error details
          </summary>
          <pre className="mt-2 p-3 bg-red-50 rounded-lg overflow-auto max-w-sm">
            {typeof error === 'string' ? error : error?.message}
          </pre>
        </details>
      )}

      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
