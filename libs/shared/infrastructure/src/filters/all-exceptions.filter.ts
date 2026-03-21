import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<any>();
    const request = ctx.getRequest<any>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: 'Internal server error' };

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request?.url,
      ...(typeof message === 'string' ? { message } : message),
    };

    if (status >= 500) {
      this.logger.error(
        `${request?.method} ${request?.url} - ${status}`,
        exception instanceof Error ? exception.stack : String(exception)
      );
    }

    // Compatible with both Express (.json) and Fastify (.send)
    if (typeof response.json === 'function') {
      response.status(status).json(errorResponse);
    } else {
      response.status(status).send(errorResponse);
    }
  }
}
