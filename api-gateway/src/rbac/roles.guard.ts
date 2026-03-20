import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleType } from '@going-monorepo-clean/shared-domain';
import { ROLES_KEY } from './roles.decorator';

/**
 * Roles Guard
 * Checks if the user has one of the required roles
 *
 * Usage with @Roles decorator:
 * @UseGuards(RolesGuard)
 * @Roles('admin', 'host')
 * async endpoint() { ... }
 *
 * If no @Roles decorator is present, the endpoint is considered public
 */
@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get required roles from decorator metadata
    const requiredRoles = this.reflector.getAllAndOverride<RoleType[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no roles required, endpoint is public
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Check if user exists and has required role
    if (!user) {
      this.logger.warn(
        `Access denied: No user found in request (missing auth)`,
      );
      return false;
    }

    if (!user.roles || !Array.isArray(user.roles)) {
      this.logger.warn(
        `Access denied: User ${user.userId} has no roles`,
      );
      return false;
    }

    const hasRole = requiredRoles.some(role => user.roles.includes(role));

    if (!hasRole) {
      this.logger.warn(
        `Access denied: User ${user.userId} with roles [${user.roles.join(', ')}] missing required roles [${requiredRoles.join(', ')}]`,
      );
      return false;
    }

    this.logger.debug(
      `Access granted: User ${user.userId} has required role(s)`,
    );
    return true;
  }
}
