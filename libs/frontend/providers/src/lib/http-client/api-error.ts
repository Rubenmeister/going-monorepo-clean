/**
 * API error codes for standardized error handling
 */
export enum ApiErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  CONFLICT = 'CONFLICT',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * API error context for debugging and logging
 */
export interface ApiErrorContext {
  endpoint?: string;
  method?: string;
  requestId?: string;
  details?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  public readonly code: ApiErrorCode;
  public readonly status: number;
  public readonly context: ApiErrorContext;
  public readonly timestamp: Date;
  public readonly retryable: boolean;

  constructor(
    message: string,
    code: ApiErrorCode,
    status: number = 0,
    context: ApiErrorContext = {},
    retryable: boolean = false
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.context = context;
    this.timestamp = new Date();
    this.retryable = retryable;

    // Maintain prototype chain
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  /**
   * Serialize error for logging
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      status: this.status,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      retryable: this.retryable,
    };
  }
}

/**
 * Unauthorized error (401)
 */
export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized', context?: ApiErrorContext) {
    super(
      message,
      ApiErrorCode.UNAUTHORIZED,
      401,
      context,
      false // Not retryable - should refresh token or redirect to login
    );
    this.name = 'UnauthorizedError';
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

/**
 * Forbidden error (403)
 */
export class ForbiddenError extends ApiError {
  constructor(message: string = 'Forbidden', context?: ApiErrorContext) {
    super(
      message,
      ApiErrorCode.FORBIDDEN,
      403,
      context,
      false // Not retryable
    );
    this.name = 'ForbiddenError';
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

/**
 * Not found error (404)
 */
export class NotFoundError extends ApiError {
  constructor(message: string = 'Not Found', context?: ApiErrorContext) {
    super(
      message,
      ApiErrorCode.NOT_FOUND,
      404,
      context,
      false // Not retryable
    );
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Validation error (400)
 */
export class ValidationError extends ApiError {
  constructor(
    message: string = 'Validation Error',
    context?: ApiErrorContext
  ) {
    super(
      message,
      ApiErrorCode.VALIDATION_ERROR,
      400,
      context,
      false // Not retryable
    );
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Conflict error (409)
 */
export class ConflictError extends ApiError {
  constructor(message: string = 'Conflict', context?: ApiErrorContext) {
    super(
      message,
      ApiErrorCode.CONFLICT,
      409,
      context,
      false // Not retryable
    );
    this.name = 'ConflictError';
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * Internal server error (5xx)
 */
export class ServerError extends ApiError {
  constructor(
    message: string = 'Server Error',
    status: number = 500,
    context?: ApiErrorContext
  ) {
    super(
      message,
      ApiErrorCode.INTERNAL_ERROR,
      status,
      context,
      status === 502 || status === 503 // Retryable for 502, 503
    );
    this.name = 'ServerError';
    Object.setPrototypeOf(this, ServerError.prototype);
  }
}

/**
 * Network error
 */
export class NetworkError extends ApiError {
  constructor(message: string = 'Network Error', context?: ApiErrorContext) {
    super(
      message,
      ApiErrorCode.NETWORK_ERROR,
      0,
      context,
      true // Retryable
    );
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * Service unavailable error (503)
 */
export class ServiceUnavailableError extends ApiError {
  constructor(
    message: string = 'Service Unavailable',
    context?: ApiErrorContext
  ) {
    super(
      message,
      ApiErrorCode.SERVICE_UNAVAILABLE,
      503,
      context,
      true // Retryable
    );
    this.name = 'ServiceUnavailableError';
    Object.setPrototypeOf(this, ServiceUnavailableError.prototype);
  }
}

/**
 * Map HTTP status code to API error code
 */
export function mapHttpStatusToErrorCode(status: number): ApiErrorCode {
  switch (status) {
    case 400:
      return ApiErrorCode.VALIDATION_ERROR;
    case 401:
      return ApiErrorCode.UNAUTHORIZED;
    case 403:
      return ApiErrorCode.FORBIDDEN;
    case 404:
      return ApiErrorCode.NOT_FOUND;
    case 409:
      return ApiErrorCode.CONFLICT;
    case 500:
    case 501:
    case 502:
    case 504:
      return ApiErrorCode.INTERNAL_ERROR;
    case 503:
      return ApiErrorCode.SERVICE_UNAVAILABLE;
    default:
      return ApiErrorCode.UNKNOWN_ERROR;
  }
}

/**
 * Create appropriate API error instance based on HTTP status and response
 */
export function createApiError(
  status: number,
  data: unknown,
  context: ApiErrorContext = {}
): ApiError {
  const message =
    (data as Record<string, unknown>)?.message?.toString() ||
    `HTTP Error ${status}`;

  switch (status) {
    case 400:
      return new ValidationError(message, context);
    case 401:
      return new UnauthorizedError(message, context);
    case 403:
      return new ForbiddenError(message, context);
    case 404:
      return new NotFoundError(message, context);
    case 409:
      return new ConflictError(message, context);
    case 502:
    case 503:
      return new ServerError(message, status, context);
    case 500:
    case 501:
    case 504:
      return new ServerError(message, status, context);
    default:
      return new ApiError(
        message,
        mapHttpStatusToErrorCode(status),
        status,
        context
      );
  }
}
