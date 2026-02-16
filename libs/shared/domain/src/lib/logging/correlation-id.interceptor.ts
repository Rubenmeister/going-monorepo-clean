import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

/**
 * Correlation ID interceptor
 * Adds X-Request-Id header to track requests across services
 */
@Injectable()
export class CorrelationIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Get or generate correlation ID
    const correlationId =
      request.headers['x-request-id'] ||
      request.headers['x-correlation-id'] ||
      uuidv4();

    // Attach to request for use in controllers/services
    request.correlationId = correlationId;

    // Add to response headers
    response.setHeader('X-Request-Id', correlationId);

    return next.handle();
  }
}
