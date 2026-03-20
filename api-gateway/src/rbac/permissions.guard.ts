import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionType } from '@going-monorepo-clean/shared-domain';
import { PERMISSIONS_KEY } from './permissions.decorator';
import { RbacService } from './rbac.service';

/**
 * Permissions Guard
 * Checks if the user has all required permissions
 *
 * Usage with @Permissions decorator:
 * @UseGuards(PermissionsGuard)
 * @Permissions('accommodations.write', 'accommodations.publish')
 * async createAndPublish() { ... }
 *
 * Can be combined with RolesGuard:
 * @UseGuards(RolesGuard, PermissionsGuard)
 * @Roles('host', 'admin')
 * @Permissions('accommodations.write')
 * async createAccommodation() { ... }
 *
 * If no @Permissions decorator is present, the endpoint has no permission check
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  private readonly logger = new Logger(PermissionsGuard.name);

  constructor(
    private reflector: Reflector,
    @Inject('RbacService')
    private rbacService: RbacService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get required permissions from decorator metadata
    const requiredPermissions = this.reflector.getAllAndOverride<
      PermissionType[]
    >(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    // If no permissions required, permission check passes
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Check if user exists
    if (!user) {
      this.logger.warn(
        `Permission denied: No user found in request (missing auth)`,
      );
      return false;
    }

    if (!user.userId) {
      this.logger.warn(`Permission denied: User has no userId`);
      return false;
    }

    // Check if user has all required permissions
    const hasPermissions = await this.rbacService.hasPermissions(
      user.userId,
      requiredPermissions,
    );

    if (!hasPermissions) {
      this.logger.warn(
        `Permission denied: User ${user.userId} missing required permissions [${requiredPermissions.join(', ')}]`,
      );
      return false;
    }

    this.logger.debug(
      `Permission granted: User ${user.userId} has required permissions`,
    );
    return true;
  }
}
