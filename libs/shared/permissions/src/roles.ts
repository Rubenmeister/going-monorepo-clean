/**
 * Role Definitions and Hierarchy
 */

import { Role } from './types';

// Role hierarchy - higher roles inherit permissions from lower roles
export const ROLE_HIERARCHY: Record<Role, Role[]> = {
  // Customer tier
  customer: [],
  provider: ['customer'],
  driver: ['customer'],
  
  // Operations tier
  ops_support: ['customer'],
  ops_supervisor: ['ops_support'],
  ops_admin: ['ops_supervisor'],
  
  // Enterprise tier
  enterprise_user: ['customer'],
  enterprise_admin: ['enterprise_user'],
  
  // System tier
  super_admin: ['ops_admin', 'enterprise_admin'],
};

// Get all inherited roles for a given role
export function getInheritedRoles(role: Role): Role[] {
  const inherited: Role[] = [role];
  const directParents = ROLE_HIERARCHY[role] || [];
  
  for (const parent of directParents) {
    inherited.push(...getInheritedRoles(parent));
  }
  
  return [...new Set(inherited)];
}

// Check if a role has another role (directly or inherited)
export function roleIncludes(userRole: Role, requiredRole: Role): boolean {
  const allRoles = getInheritedRoles(userRole);
  return allRoles.includes(requiredRole);
}

// Role display names (Spanish)
export const ROLE_LABELS: Record<Role, string> = {
  customer: 'Cliente',
  provider: 'Proveedor',
  driver: 'Conductor',
  ops_support: 'Soporte',
  ops_supervisor: 'Supervisor Ops',
  ops_admin: 'Admin Ops',
  enterprise_user: 'Usuario Empresa',
  enterprise_admin: 'Admin Empresa',
  super_admin: 'Super Admin',
};

// Role groups for route authorization
export const ROLE_GROUPS = {
  customer: ['customer'] as Role[],
  provider: ['provider', 'driver'] as Role[],
  ops: ['ops_support', 'ops_supervisor', 'ops_admin'] as Role[],
  enterprise: ['enterprise_user', 'enterprise_admin'] as Role[],
  admin: ['ops_admin', 'super_admin'] as Role[],
} as const;
