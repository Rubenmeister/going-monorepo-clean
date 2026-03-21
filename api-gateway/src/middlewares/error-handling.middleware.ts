/**
 * Global Error Handling Middleware
 * Standardizes error responses across all API endpoints
 * Provides proper logging, error categorization, and client-safe error messages
 */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { v4 as uuid } from 'uuid';

interface ErrorResponse {
  requestId: string;
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  method: string;
  details?: Record<string, any>;
}

@Catch()
export class GlobalErrorHandlingFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalErrorHandlingFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const requestId = (request.headers['x-request-id'] as string) || uuid();
    const timestamp = new Date().toISOString();
    const path = request.url;
    const method = request.method;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let error = 'InternalServerError';
    let message = 'An unexpected error occurred';
    let details: Record<string, any> | undefined;

    // Handle HTTP Exceptions
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        const exObj = exceptionResponse as Record<string, any>;
        message =
          exObj.message || exception.message || 'An HTTP error occurred';
        error = exObj.error || 'HttpException';
        details = exObj.details;
      } else {
        message = exceptionResponse as string;
      }
    }
    // Handle Validation Errors
    else if (
      exception instanceof BadRequestException &&
      (exception as any).getResponse()
    ) {
      const response = (exception as any).getResponse() as Record<string, any>;
      status = HttpStatus.BAD_REQUEST;
      error = 'ValidationError';
      message = response.message || 'Validation failed';
      if (Array.isArray(response.message)) {
        details = { validationErrors: response.message };
      }
    }
    // Handle Mongoose/Database Errors
    else if ((exception as any).name === 'MongooseError') {
      status = HttpStatus.BAD_REQUEST;
      error = 'DatabaseError';
      message = 'A database error occurred';
      if (process.env.NODE_ENV === 'development') {
        details = { mongoError: (exception as Error).message };
      }
    }
    // Handle Regular Errors
    else if (exception instanceof Error) {
      error = exception.constructor.name;
      message = exception.message;

      // Check for specific error patterns
      if (exception.message.includes('Unauthorized')) {
        status = HttpStatus.UNAUTHORIZED;
      } else if (exception.message.includes('Forbidden')) {
        status = HttpStatus.FORBIDDEN;
      } else if (exception.message.includes('Not found')) {
        status = HttpStatus.NOT_FOUND;
      }

      // Only include stack trace in development
      if (process.env.NODE_ENV === 'development') {
        details = { stack: exception.stack };
      }
    }

    // Log error
    this.logError(requestId, status, error, message, path, method, exception);

    // Build response
    const errorResponse: ErrorResponse = {
      requestId,
      timestamp,
      status,
      error,
      message,
      path,
      method,
      ...(details && { details }),
    };

    // Set response headers
    response.setHeader('X-Request-ID', requestId);
    response.setHeader('Content-Type', 'application/json');

    // Send response
    response.status(status).json(errorResponse);
  }

  private logError(
    requestId: string,
    status: number,
    error: string,
    message: string,
    path: string,
    method: string,
    exception: unknown
  ) {
    const logLevel = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'log';

    const logMessage = `[${requestId}] ${method} ${path} - ${status} ${error}: ${message}`;

    if (logLevel === 'error') {
      this.logger.error(
        logMessage,
        exception instanceof Error ? exception.stack : ''
      );
    } else if (logLevel === 'warn') {
      this.logger.warn(logMessage);
    } else {
      this.logger.log(logMessage);
    }
  }
}

/**
 * Async Error Wrapper for Route Handlers
 * Catches async errors that would otherwise be unhandled
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: any) => Promise<any>
) => {
  return (req: Request, res: Response, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
