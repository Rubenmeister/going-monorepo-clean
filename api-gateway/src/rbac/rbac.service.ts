import { Injectable, Logger } from '@nestjs/common';
import { UUID } from '@going-monorepo-clean/shared-domain';
import {
  RoleType,
  Role,
  PermissionType,
  ROLE_HIERARCHY,
  getRoleByType,
} from '@going-monorepo-clean/shared-domain';

/**
 * RBAC Service
 * Central service for role-based access control operations
 * Evaluates permissions and manages role hierarchy
 */
@Injectable()
export class RbacService {
  private readonly logger = new Logger(RbacService.name);

  /**
   * Check if user has all required permissions
   *
   * In a real implementation, this would fetch user permissions from a database
   * For now, we derive permissions from the user's roles
   *
   * TODO: Extend to support per-user permission overrides
   */
  async hasPermissions(
    userId: UUID,
    requiredPermissions: PermissionType[],
  ): Promise<boolean> {
    // TODO: Fetch user from database to get exact roles
    // For now, this is a placeholder that always returns true for authenticated users
    // In production, this would:
    // 1. Fetch user from database
    // 2. Get user's roles
    // 3. Compile list of permissions from roles
    // 4. Check if all required permissions are present

    this.logger.warn(
      `RbacService.hasPermissions: User-database integration not yet implemented. Granting access to user ${userId}`,
    );

    return true;
  }

  /**
   * Get all permissions for a specific role
   */
  getPermissionsForRole(role: RoleType): PermissionType[] {
    const roleEntity = getRoleByType(role);
    return roleEntity.getPermissions();
  }

  /**
   * Check if user has at least one of the required roles
   */
  hasRole(userRoles: RoleType[], requiredRoles: RoleType[]): boolean {
    return userRoles.some(role => requiredRoles.includes(role));
  }

  /**
   * Check if a role has higher hierarchy than another
   */
  isHigherRole(role1: RoleType, role2: RoleType): boolean {
    const r1 = getRoleByType(role1);
    const r2 = getRoleByType(role2);
    return r1.isHigherOrEqual(r2);
  }

  /**
   * Get role hierarchy (for sorting/filtering)
   */
  getRoleHierarchy(role: RoleType): number {
    const config = ROLE_HIERARCHY[role];
    return config?.hierarchy || 0;
  }

  /**
   * Check if user can access a specific resource with an action
   */
  canAccessResource(
    userRoles: RoleType[],
    resource: string,
    action: string,
  ): boolean {
    return userRoles.some(roleName => {
      const role = getRoleByType(roleName);
      return role.canAccess(resource, action);
    });
  }

  /**
   * Combine permissions from multiple roles
   */
  combinePermissions(...roles: RoleType[]): Set<PermissionType> {
    const permissions = new Set<PermissionType>();

    for (const role of roles) {
      const roleEntity = getRoleByType(role);
      roleEntity.getPermissions().forEach(perm => permissions.add(perm));
    }

    return permissions;
  }

  /**
   * Get all available roles
   */
  getAllRoles(): Record<RoleType, { displayName: string; permissions: string[] }> {
    const result: Record<RoleType, { displayName: string; permissions: string[] }> = {
      admin: {
        displayName: ROLE_HIERARCHY.admin.displayName,
        permissions: ROLE_HIERARCHY.admin.permissions,
      },
      host: {
        displayName: ROLE_HIERARCHY.host.displayName,
        permissions: ROLE_HIERARCHY.host.permissions,
      },
      driver: {
        displayName: ROLE_HIERARCHY.driver.displayName,
        permissions: ROLE_HIERARCHY.driver.permissions,
      },
      user: {
        displayName: ROLE_HIERARCHY.user.displayName,
        permissions: ROLE_HIERARCHY.user.permissions,
      },
    };

    return result;
  }

  /**
   * Check if a permission is valid in the system
   */
  isValidPermission(permission: string): permission is PermissionType {
    try {
      // Try to create a permission to validate it
      const [resource, action] = permission.split('.');
      return (
        typeof resource === 'string' &&
        typeof action === 'string' &&
        Object.values(ROLE_HIERARCHY).some(role =>
          role.permissions.includes(permission as PermissionType),
        )
      );
    } catch {
      return false;
    }
  }
}
