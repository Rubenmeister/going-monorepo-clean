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

export interface ApiErrorContext {
  endpoint?: string;
  method?: string;
  requestId?: string;
  details?: Record<string, unknown>;
  [key: string]: unknown;
}

export class ApiError extends Error {
  public readonly code: ApiErrorCode;
  public readonly status: number;
  public readonly context: ApiErrorContext;
  public readonly timestamp: Date;
  public readonly retryable: boolean;

  constructor(
    message: string,
    code: ApiErrorCode,
    status = 0,
    context: ApiErrorContext = {},
    retryable = false
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.context = context;
    this.timestamp = new Date();
    this.retryable = retryable;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}
