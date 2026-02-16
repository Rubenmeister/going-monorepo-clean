import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Global exception filter for standardized error responses
 * Returns consistent format: { statusCode, message, timestamp, path }
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: string | string[];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // Handle NestJS validation errors (class-validator)
      if (typeof exceptionResponse === 'object' && 'message' in exceptionResponse) {
        message = (exceptionResponse as any).message;
      } else {
        message = exceptionResponse as string;
      }
    } else {
      // Unknown/unhandled exceptions
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';

      // Log full error for debugging
      this.logger.error(
        `Unhandled exception: ${exception instanceof Error ? exception.message : 'Unknown error'}`,
        exception instanceof Error ? exception.stack : ''
      );
    }

    const errorResponse = {
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      correlationId: request.headers['x-request-id'] || request.headers['x-correlation-id'],
    };

    response.status(status).json(errorResponse);
  }
}
