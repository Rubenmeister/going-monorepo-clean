import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { AuditLogInterceptor } from '@going-monorepo-clean/shared-domain';

describe('AuditLogInterceptor', () => {
  let interceptor: AuditLogInterceptor;

  beforeEach(() => {
    interceptor = new AuditLogInterceptor();
  });

  const createMockContext = (
    user?: { userId: string; roles: string[] },
  ): ExecutionContext => {
    const request = {
      method: 'POST',
      url: '/auth/login',
      ip: '127.0.0.1',
      user,
    };
    return {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => ({ name: 'login' }),
      getClass: () => ({ name: 'AuthController' }),
    } as unknown as ExecutionContext;
  };

  it('should log successful requests and pass through response', (done) => {
    const context = createMockContext({ userId: 'user-123', roles: ['admin'] });
    const next: CallHandler = { handle: () => of({ success: true }) };

    const logSpy = jest.spyOn((interceptor as any).logger, 'log').mockImplementation();

    interceptor.intercept(context, next).subscribe({
      next: (value) => {
        expect(value).toEqual({ success: true });
      },
      complete: () => {
        expect(logSpy).toHaveBeenCalledWith(
          expect.stringContaining('[POST] /auth/login'),
        );
        expect(logSpy).toHaveBeenCalledWith(
          expect.stringContaining('user=user-123'),
        );
        expect(logSpy).toHaveBeenCalledWith(
          expect.stringContaining('status=OK'),
        );
        done();
      },
    });
  });

  it('should log failed requests with error info', (done) => {
    const context = createMockContext();
    const error = { status: 401, message: 'Unauthorized' };
    const next: CallHandler = { handle: () => throwError(() => error) };

    const warnSpy = jest.spyOn((interceptor as any).logger, 'warn').mockImplementation();

    interceptor.intercept(context, next).subscribe({
      error: () => {
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining('user=anonymous'),
        );
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining('status=401'),
        );
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining('error=Unauthorized'),
        );
        done();
      },
    });
  });

  it('should handle anonymous users correctly', (done) => {
    const context = createMockContext(undefined);
    const next: CallHandler = { handle: () => of('ok') };

    const logSpy = jest.spyOn((interceptor as any).logger, 'log').mockImplementation();

    interceptor.intercept(context, next).subscribe({
      complete: () => {
        expect(logSpy).toHaveBeenCalledWith(
          expect.stringContaining('user=anonymous'),
        );
        expect(logSpy).toHaveBeenCalledWith(
          expect.stringContaining('roles=[none]'),
        );
        done();
      },
    });
  });
});
