import { Injectable, Logger } from '@nestjs/common';
import { IRBACService } from '../../interfaces/corporate-auth.service';
import { CorporateUserRole } from '../../interfaces/corporate-user.interface';
import { CorporateUserService } from './corporate-user.service';

/**
 * Role-Based Access Control Service
 * Manages roles and permissions for corporate users
 *
 * SECURITY: This service implements mandatory permission checks:
 * - Always retrieves user from database to validate role
 * - Fails open: denies access if user not found or permission check fails
 * - Logs all permission checks for audit trail
 */
@Injectable()
export class RBACService implements IRBACService {
  private readonly logger = new Logger(RBACService.name);

  constructor(private readonly userService: CorporateUserService) {}

  /**
   * Permission matrix for roles
   */
  private readonly rolePermissions: Record<CorporateUserRole, string[]> = {
    [CorporateUserRole.SUPER_ADMIN]: [
      'manage_users',
      'configure_sso',
      'configure_payment',
      'view_all_bookings',
      'approve_bookings',
      'view_tracking',
      'view_reports',
      'manage_limits',
      'view_invoices',
      'export_data',
    ],
    [CorporateUserRole.MANAGER]: [
      'manage_team_users',
      'approve_bookings',
      'view_team_bookings',
      'view_team_tracking',
      'view_team_reports',
    ],
    [CorporateUserRole.EMPLOYEE]: [
      'create_bookings',
      'view_own_bookings',
      'view_own_profile',
      'update_own_profile',
    ],
  };

  /**
   * Check if user has a specific role
   * SECURITY: Fails closed (returns false) if user not found
   */
  async hasRole(userId: string, role: CorporateUserRole): Promise<boolean> {
    try {
      const user = await this.userService.getUserById(userId);
      if (!user) {
        this.logger.warn(`User not found for role check: ${userId}`);
        return false;
      }
      const hasRole = user.role === role;
      if (hasRole) {
        this.logger.debug(`User ${userId} has role ${role}`);
      }
      return hasRole;
    } catch (error) {
      this.logger.error(`Failed to check user role for ${userId}:`, error);
      return false; // Fail secure
    }
  }

  /**
   * Check if user can access resource/action
   * SECURITY: Fails closed (returns false) if user not found or permission denied
   */
  async canAccess(
    userId: string,
    action: string,
    resource?: string
  ): Promise<boolean> {
    try {
      // Fetch user's role from database
      const user = await this.userService.getUserById(userId);
      if (!user) {
        this.logger.warn(
          `User not found for access check: ${userId} action=${action} resource=${resource}`
        );
        return false;
      }

      // Check if action is in the role's permissions
      const permissions = this.rolePermissions[user.role] || [];
      const canAccess = permissions.includes(action);

      if (!canAccess) {
        this.logger.warn(
          `Access denied: User ${userId} (role=${user.role}) cannot perform action=${action}`
        );
        return false;
      }

      this.logger.debug(
        `Access granted: User ${userId} (role=${user.role}) can perform action=${action}`
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to check access for ${userId}: ${error.message}`,
        error.stack
      );
      return false; // Fail secure
    }
  }

  /**
   * Get all permissions for user
   * Returns empty array if user not found (fail secure)
   */
  async getPermissions(userId: string): Promise<string[]> {
    try {
      const user = await this.userService.getUserById(userId);
      if (!user) {
        this.logger.warn(`User not found for permission lookup: ${userId}`);
        return [];
      }

      const permissions = this.rolePermissions[user.role] || [];
      this.logger.debug(
        `User ${userId} has ${permissions.length} permissions (role=${user.role})`
      );
      return permissions;
    } catch (error) {
      this.logger.error(
        `Failed to get permissions for ${userId}: ${error.message}`,
        error.stack
      );
      return []; // Fail secure
    }
  }

  /**
   * Assign role to user
   * Updates the user's role in the database
   */
  async assignRole(userId: string, role: CorporateUserRole): Promise<void> {
    try {
      const user = await this.userService.updateUserRole(userId, role);
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }
      this.logger.log(`Role assigned: User ${userId} now has role ${role}`);
    } catch (error) {
      this.logger.error(
        `Failed to assign role ${role} to user ${userId}: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Revoke role from user
   * Sets user role back to EMPLOYEE (default non-privileged role)
   */
  async revokeRole(userId: string, _role: CorporateUserRole): Promise<void> {
    try {
      const user = await this.userService.updateUserRole(
        userId,
        CorporateUserRole.EMPLOYEE
      );
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }
      this.logger.log(
        `Role revoked: User ${userId} downgraded to ${CorporateUserRole.EMPLOYEE}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to revoke role from user ${userId}: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Get all role permissions
   */
  getRolePermissions(role: CorporateUserRole): string[] {
    return this.rolePermissions[role] || [];
  }

  /**
   * Check if action is allowed for role
   */
  isActionAllowed(role: CorporateUserRole, action: string): boolean {
    const permissions = this.rolePermissions[role] || [];
    return permissions.includes(action);
  }
}
