import { ApiErrorCode } from '@going-monorepo-clean/frontend-providers';

/**
 * User-friendly error messages for API errors
 * Mapped by error code
 */
export const ERROR_MESSAGES: Record<ApiErrorCode, string> = {
  [ApiErrorCode.UNAUTHORIZED]:
    'Your session has expired. Please log in again.',
  [ApiErrorCode.FORBIDDEN]:
    'You do not have permission to perform this action.',
  [ApiErrorCode.NOT_FOUND]:
    'The requested resource was not found.',
  [ApiErrorCode.VALIDATION_ERROR]:
    'Please check your input and try again.',
  [ApiErrorCode.CONFLICT]:
    'This resource already exists or conflicts with an existing one.',
  [ApiErrorCode.INTERNAL_ERROR]:
    'An error occurred on the server. Please try again later.',
  [ApiErrorCode.SERVICE_UNAVAILABLE]:
    'The service is temporarily unavailable. Please try again in a few moments.',
  [ApiErrorCode.NETWORK_ERROR]:
    'Network connection error. Please check your internet connection and try again.',
  [ApiErrorCode.UNKNOWN_ERROR]:
    'An unexpected error occurred. Please try again or contact support.',
};

/**
 * Get user-friendly error message for an error code
 */
export function getErrorMessage(code: ApiErrorCode): string {
  return ERROR_MESSAGES[code] || ERROR_MESSAGES[ApiErrorCode.UNKNOWN_ERROR];
}

/**
 * Error message variants for different contexts
 */
export const ERROR_MESSAGE_VARIANTS = {
  login: {
    [ApiErrorCode.UNAUTHORIZED]:
      'Invalid email or password. Please try again.',
    [ApiErrorCode.VALIDATION_ERROR]:
      'Please enter a valid email and password.',
  },
  booking: {
    [ApiErrorCode.CONFLICT]:
      'This booking time is no longer available. Please choose another time.',
    [ApiErrorCode.NOT_FOUND]:
      'The selected service is no longer available.',
  },
  payment: {
    [ApiErrorCode.VALIDATION_ERROR]:
      'Please check your payment information and try again.',
    [ApiErrorCode.CONFLICT]:
      'This payment has already been processed.',
  },
} as const;

/**
 * Get context-specific error message
 */
export function getContextualErrorMessage(
  code: ApiErrorCode,
  context?: keyof typeof ERROR_MESSAGE_VARIANTS
): string {
  if (context && context in ERROR_MESSAGE_VARIANTS) {
    const contextMessages =
      ERROR_MESSAGE_VARIANTS[
        context as keyof typeof ERROR_MESSAGE_VARIANTS
      ];
    if (code in contextMessages) {
      return contextMessages[code as keyof typeof contextMessages];
    }
  }

  return getErrorMessage(code);
}
