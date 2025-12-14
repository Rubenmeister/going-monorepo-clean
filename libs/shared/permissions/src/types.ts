/**
 * Role and Permission Types for RBAC System
 */

// User roles in the system
export type Role = 
  // Customer roles
  | 'customer'
  | 'provider'
  | 'driver'
  // Operations roles
  | 'ops_admin'
  | 'ops_supervisor'
  | 'ops_support'
  // Enterprise roles
  | 'enterprise_admin'
  | 'enterprise_user'
  // System roles
  | 'super_admin';

// Resources that can be accessed
export type Resource =
  | 'trips'
  | 'bookings'
  | 'tours'
  | 'packages'
  | 'payments'
  | 'users'
  | 'drivers'
  | 'providers'
  | 'reports'
  | 'analytics'
  | 'settings'
  | 'fleet'
  | 'enterprise';

// Actions that can be performed
export type Action =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'list'
  | 'manage'
  | 'export';

// Permission definition
export interface Permission {
  action: Action;
  resource: Resource;
  conditions?: {
    ownOnly?: boolean;      // Can only access own resources
    tenantOnly?: boolean;   // Can only access same tenant
  };
}

// User with role information
export interface RoleUser {
  id: string;
  email: string;
  role: Role;
  tenantId?: string;
}

// Permission check result
export interface PermissionResult {
  allowed: boolean;
  reason?: string;
}
