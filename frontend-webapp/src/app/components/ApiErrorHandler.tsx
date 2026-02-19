'use client';

import { useCallback } from 'react';
import { ApiError } from '@going-monorepo-clean/frontend-providers';
import { useUIStore } from '@going-monorepo-clean/frontend-stores';
import { ERROR_MESSAGES } from '../utils/error-messages';

/**
 * Hook for handling API errors with automatic notification dispatch
 */
export function useApiErrorHandler() {
  const { addNotification } = useUIStore();

  const handleError = useCallback(
    (error: unknown, context?: { endpoint?: string; retry?: () => void }) => {
      if (!(error instanceof ApiError)) {
        console.error('[API Error Handler] Unknown error:', error);
        addNotification({
          message: 'An unexpected error occurred',
          type: 'error',
          duration: 5000,
        });
        return;
      }

      // Get user-friendly error message
      const message = ERROR_MESSAGES[error.code] || error.message;

      // Add notification with optional retry action
      addNotification({
        message,
        type: 'error',
        duration: error.retryable ? 8000 : 5000,
        action: context?.retry && error.retryable
          ? {
              label: 'Retry',
              onClick: context.retry,
            }
          : undefined,
      });

      // Log error with context for debugging
      console.error('[API Error]', {
        code: error.code,
        status: error.status,
        message: error.message,
        context: error.context,
        retryable: error.retryable,
      });
    },
    [addNotification]
  );

  return handleError;
}

/**
 * Hook for wrapping async functions with error handling
 */
export function useApiError<TArgs extends unknown[], TResult>(
  asyncFn: (...args: TArgs) => Promise<TResult>,
  options?: {
    onError?: (error: ApiError) => void;
    onSuccess?: (result: TResult) => void;
  }
) {
  const handleError = useApiErrorHandler();

  return useCallback(
    async (...args: TArgs) => {
      try {
        const result = await asyncFn(...args);
        options?.onSuccess?.(result);
        return result;
      } catch (error) {
        if (error instanceof ApiError) {
          handleError(error);
          options?.onError?.(error);
        } else {
          handleError(error);
        }
        throw error;
      }
    },
    [asyncFn, handleError, options]
  );
}
