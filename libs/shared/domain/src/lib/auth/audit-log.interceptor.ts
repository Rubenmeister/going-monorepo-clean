import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger('AuditLog');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, ip } = request;
    const user = request.user;
    const userId = user?.userId ?? 'anonymous';
    const roles = user?.roles?.join(',') ?? 'none';
    const handler = `${context.getClass().name}.${context.getHandler().name}`;
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          this.logger.log(
            `[${method}] ${url} | user=${userId} roles=[${roles}] | handler=${handler} | status=OK | ${duration}ms | ip=${ip}`,
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const status = error?.status ?? 500;
          this.logger.warn(
            `[${method}] ${url} | user=${userId} roles=[${roles}] | handler=${handler} | status=${status} | ${duration}ms | ip=${ip} | error=${error?.message}`,
          );
        },
      }),
    );
  }
}
