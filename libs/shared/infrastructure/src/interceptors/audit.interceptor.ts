import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<any>();
    const { method, url, user } = request;
    const userId = user?.id || 'anonymous';

    return next.handle().pipe(
      tap({
        next: () => {
          this.logger.log(
            `AUDIT: ${method} ${url} by user=${userId}`,
            'AuditLog'
          );
        },
        error: (error) => {
          this.logger.warn(
            `AUDIT ERROR: ${method} ${url} by user=${userId} - ${error?.message}`,
            'AuditLog'
          );
        },
      })
    );
  }
}
