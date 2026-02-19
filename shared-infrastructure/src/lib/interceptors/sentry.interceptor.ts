import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  BadRequestException,
  HttpException,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import * as Sentry from '@sentry/node';

/**
 * Global error interceptor that captures all exceptions and sends them to Sentry
 */
@Injectable()
export class SentryInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        // Don't report validation errors to Sentry
        if (error instanceof BadRequestException) {
          return throwError(() => error);
        }

        // Capture the error in Sentry
        Sentry.captureException(error, {
          contexts: {
            http: {
              method: context.switchToHttp().getRequest().method,
              url: context.switchToHttp().getRequest().originalUrl,
              status_code: error.status || 500,
            },
          },
        });

        return throwError(() => error);
      })
    );
  }
}
