import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '@going-monorepo-clean/shared-domain';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  const createMockContext = (user?: { roles: string[] }): ExecutionContext => {
    const request = { user };
    return {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
    } as unknown as ExecutionContext;
  };

  it('should allow access when endpoint is public', () => {
    jest.spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(true); // isPublic = true

    const context = createMockContext();
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access when no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(false)  // isPublic = false
      .mockReturnValueOnce(null);  // requiredRoles = null

    const context = createMockContext({ roles: ['user'] });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access when user has a required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(false)           // isPublic = false
      .mockReturnValueOnce(['admin', 'host']); // requiredRoles

    const context = createMockContext({ roles: ['admin'] });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access when user lacks required roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(false)           // isPublic = false
      .mockReturnValueOnce(['admin']);       // requiredRoles

    const context = createMockContext({ roles: ['user'] });
    expect(() => guard.canActivate(context)).toThrow(
      new ForbiddenException('Access denied: requires one of [admin]'),
    );
  });

  it('should deny access when user has no roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(false)           // isPublic = false
      .mockReturnValueOnce(['admin']);       // requiredRoles

    const context = createMockContext(undefined); // no user
    expect(() => guard.canActivate(context)).toThrow(
      new ForbiddenException('Access denied: no roles assigned'),
    );
  });

  it('should allow when user has one of multiple required roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(false)                    // isPublic = false
      .mockReturnValueOnce(['host', 'admin', 'driver']); // requiredRoles

    const context = createMockContext({ roles: ['driver'] });
    expect(guard.canActivate(context)).toBe(true);
  });
});
