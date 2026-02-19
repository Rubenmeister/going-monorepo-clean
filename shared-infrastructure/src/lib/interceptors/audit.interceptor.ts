import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { Request } from 'express';
import { AuditLogService } from '@going-monorepo-clean/domains-audit-application';
import { FieldChange } from '@going-monorepo-clean/domains-audit-core';
import { AUDIT_ACTION_KEY, AUDIT_RESOURCE_KEY } from '../decorators/audit.decorator';

/**
 * AuditInterceptor
 *
 * Automatically records audit events for endpoints decorated with @Audit().
 * Captures:
 * - User identity from JWT (request.user)
 * - IP address (X-Forwarded-For → X-Real-IP → socket)
 * - Request duration
 * - Body changes (for UPDATE operations)
 * - Success / failure result + error message
 *
 * Must be registered globally or per-controller via @UseInterceptors().
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly auditLogService: AuditLogService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const action = this.reflector.get(AUDIT_ACTION_KEY, context.getHandler());
    const resourceType = this.reflector.get(AUDIT_RESOURCE_KEY, context.getHandler());

    // Only process audited endpoints
    if (!action || !resourceType) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const startTime = Date.now();
    const ipAddress = this.extractIp(request);
    const serviceId = process.env['SERVICE_ID'] ?? 'api-gateway';

    return next.handle().pipe(
      tap(() => {
        // Successful response
        const duration = Date.now() - startTime;
        const user = (request as any).user;
        const userId = user?.userId ?? user?.sub ?? 'anonymous';
        const resourceId = this.extractResourceId(request);
        const changes = this.extractChanges(action, request.body);

        // Fire-and-forget - never await in an interceptor
        this.auditLogService
          .recordSuccess(
            userId,
            serviceId,
            ipAddress,
            action,
            resourceType,
            resourceId,
            duration,
            changes,
            { method: request.method, url: request.url },
          )
          .catch(err =>
            this.logger.error(`Audit record failed: ${err.message}`),
          );
      }),
      catchError(error => {
        // Failed response
        const duration = Date.now() - startTime;
        const user = (request as any).user;
        const userId = user?.userId ?? user?.sub ?? 'anonymous';
        const resourceId = this.extractResourceId(request);

        this.auditLogService
          .recordFailure(
            userId,
            serviceId,
            ipAddress,
            action,
            resourceType,
            resourceId,
            duration,
            error instanceof Error ? error.message : String(error),
            {
              method: request.method,
              url: request.url,
              errorName: error?.name,
              statusCode: error?.status,
            },
          )
          .catch(err =>
            this.logger.error(`Audit failure record failed: ${err.message}`),
          );

        return throwError(() => error);
      }),
    );
  }

  private extractIp(request: Request): string {
    const forwarded = request.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    const realIp = request.headers['x-real-ip'];
    if (typeof realIp === 'string') {
      return realIp;
    }
    return request.socket?.remoteAddress ?? 'unknown';
  }

  private extractResourceId(request: Request): string {
    // Prefer URL param :id, then body.id, then 'unknown'
    return (
      (request.params as any)?.id ??
      (request.body as any)?.id ??
      'unknown'
    );
  }

  private extractChanges(
    action: string,
    body: unknown,
  ): FieldChange[] | undefined {
    if (action !== 'UPDATE' || !body || typeof body !== 'object') {
      return undefined;
    }

    // Record top-level fields as changed (field values come from the request body)
    return Object.entries(body as Record<string, unknown>)
      .filter(([key]) => key !== 'password' && key !== 'passwordHash')
      .map(([field, newValue]) => ({ field, newValue }));
  }
}
