import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class SentryInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        try {
          // Try to capture to Sentry if available
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const Sentry = require('@sentry/node');
          if (typeof Sentry?.captureException === 'function') {
            Sentry.captureException(error);
          }
        } catch {
          // Sentry not available, continue
        }
        return throwError(() => error);
      })
    );
  }
}
