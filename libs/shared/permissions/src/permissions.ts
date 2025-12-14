/**
 * Permission Definitions and Authorization Logic
 * 
 * Core function: can(user, action, resource) -> boolean
 */

import { Role, Resource, Action, RoleUser, PermissionResult, Permission } from './types';
import { roleIncludes, ROLE_GROUPS } from './roles';

// Permission matrix: which roles can do what
const PERMISSIONS: Record<Role, Permission[]> = {
  // Customer - basic user
  customer: [
    { action: 'create', resource: 'trips' },
    { action: 'read', resource: 'trips', conditions: { ownOnly: true } },
    { action: 'list', resource: 'trips', conditions: { ownOnly: true } },
    { action: 'create', resource: 'bookings' },
    { action: 'read', resource: 'bookings', conditions: { ownOnly: true } },
    { action: 'list', resource: 'bookings', conditions: { ownOnly: true } },
    { action: 'read', resource: 'tours' },
    { action: 'list', resource: 'tours' },
  ],

  // Provider - service provider
  provider: [
    { action: 'create', resource: 'tours' },
    { action: 'update', resource: 'tours', conditions: { ownOnly: true } },
    { action: 'read', resource: 'bookings' },
    { action: 'list', resource: 'bookings' },
    { action: 'read', resource: 'payments', conditions: { ownOnly: true } },
  ],

  // Driver - transport driver
  driver: [
    { action: 'read', resource: 'trips' },
    { action: 'update', resource: 'trips', conditions: { ownOnly: true } },
    { action: 'read', resource: 'packages' },
    { action: 'update', resource: 'packages', conditions: { ownOnly: true } },
    { action: 'read', resource: 'fleet' },
  ],

  // Ops Support - basic ops access
  ops_support: [
    { action: 'read', resource: 'trips' },
    { action: 'read', resource: 'bookings' },
    { action: 'read', resource: 'users' },
    { action: 'read', resource: 'drivers' },
  ],

  // Ops Supervisor - more ops access
  ops_supervisor: [
    { action: 'read', resource: 'payments' },
    { action: 'read', resource: 'reports' },
    { action: 'update', resource: 'trips' },
    { action: 'update', resource: 'bookings' },
  ],

  // Ops Admin - full ops access
  ops_admin: [
    { action: 'manage', resource: 'trips' },
    { action: 'manage', resource: 'bookings' },
    { action: 'manage', resource: 'tours' },
    { action: 'manage', resource: 'packages' },
    { action: 'manage', resource: 'users' },
    { action: 'manage', resource: 'drivers' },
    { action: 'manage', resource: 'providers' },
    { action: 'read', resource: 'analytics' },
    { action: 'export', resource: 'reports' },
  ],

  // Enterprise User - tenant restricted
  enterprise_user: [
    { action: 'read', resource: 'trips', conditions: { tenantOnly: true } },
    { action: 'read', resource: 'bookings', conditions: { tenantOnly: true } },
    { action: 'read', resource: 'packages', conditions: { tenantOnly: true } },
    { action: 'read', resource: 'drivers', conditions: { tenantOnly: true } },
  ],

  // Enterprise Admin - tenant admin
  enterprise_admin: [
    { action: 'manage', resource: 'enterprise' },
    { action: 'manage', resource: 'users', conditions: { tenantOnly: true } },
    { action: 'manage', resource: 'drivers', conditions: { tenantOnly: true } },
    { action: 'read', resource: 'reports', conditions: { tenantOnly: true } },
    { action: 'read', resource: 'analytics', conditions: { tenantOnly: true } },
  ],

  // Super Admin - everything
  super_admin: [
    { action: 'manage', resource: 'trips' },
    { action: 'manage', resource: 'bookings' },
    { action: 'manage', resource: 'tours' },
    { action: 'manage', resource: 'packages' },
    { action: 'manage', resource: 'payments' },
    { action: 'manage', resource: 'users' },
    { action: 'manage', resource: 'drivers' },
    { action: 'manage', resource: 'providers' },
    { action: 'manage', resource: 'reports' },
    { action: 'manage', resource: 'analytics' },
    { action: 'manage', resource: 'settings' },
    { action: 'manage', resource: 'fleet' },
    { action: 'manage', resource: 'enterprise' },
  ],
};

/**
 * Check if a user can perform an action on a resource
 * 
 * @param user - The user to check
 * @param action - The action to perform
 * @param resource - The resource to access
 * @param context - Optional context (resourceOwnerId, resourceTenantId)
 * @returns PermissionResult with allowed status and reason
 */
export function can(
  user: RoleUser | null,
  action: Action,
  resource: Resource,
  context?: { resourceOwnerId?: string; resourceTenantId?: string }
): PermissionResult {
  // No user = no access
  if (!user) {
    return { allowed: false, reason: 'No authenticated user' };
  }

  // Super admin can do everything
  if (user.role === 'super_admin') {
    return { allowed: true };
  }

  // Get permissions for user's role
  const rolePermissions = PERMISSIONS[user.role] || [];
  
  // Find matching permission
  const matchingPerm = rolePermissions.find(p => {
    // Check resource match
    if (p.resource !== resource) return false;
    
    // Check action match (manage includes all actions)
    if (p.action !== action && p.action !== 'manage') return false;
    
    return true;
  });

  if (!matchingPerm) {
    return { 
      allowed: false, 
      reason: `Role '${user.role}' cannot '${action}' on '${resource}'` 
    };
  }

  // Check conditions
  if (matchingPerm.conditions?.ownOnly && context?.resourceOwnerId) {
    if (user.id !== context.resourceOwnerId) {
      return { allowed: false, reason: 'Can only access own resources' };
    }
  }

  if (matchingPerm.conditions?.tenantOnly && context?.resourceTenantId) {
    if (user.tenantId !== context.resourceTenantId) {
      return { allowed: false, reason: 'Can only access resources in your tenant' };
    }
  }

  return { allowed: true };
}

/**
 * Check if user has one of the required roles
 */
export function hasRole(user: RoleUser | null, roles: Role[]): boolean {
  if (!user) return false;
  return roles.some(role => roleIncludes(user.role, role));
}

/**
 * Check if user is in a role group
 */
export function isInRoleGroup(
  user: RoleUser | null, 
  group: keyof typeof ROLE_GROUPS
): boolean {
  if (!user) return false;
  return ROLE_GROUPS[group].includes(user.role);
}

/**
 * Check if user has access to tenant
 */
export function hasTenantAccess(user: RoleUser | null, tenantId: string): boolean {
  if (!user) return false;
  if (user.role === 'super_admin' || user.role === 'ops_admin') return true;
  return user.tenantId === tenantId;
}
