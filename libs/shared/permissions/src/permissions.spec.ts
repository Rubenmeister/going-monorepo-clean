/**
 * Unit Tests for Permission System
 */

import { 
  can, 
  hasRole, 
  hasTenantAccess, 
  isInRoleGroup,
  Role,
  RoleUser 
} from '../src';

describe('Permissions System', () => {
  // Test users
  const customer: RoleUser = { id: '1', email: 'customer@test.com', role: 'customer' };
  const driver: RoleUser = { id: '2', email: 'driver@test.com', role: 'driver' };
  const opsAdmin: RoleUser = { id: '3', email: 'ops@test.com', role: 'ops_admin' };
  const enterpriseUser: RoleUser = { id: '4', email: 'ent@test.com', role: 'enterprise_user', tenantId: 'tenant1' };
  const superAdmin: RoleUser = { id: '5', email: 'super@test.com', role: 'super_admin' };

  describe('can() function', () => {
    it('should allow customer to create trips', () => {
      const result = can(customer, 'create', 'trips');
      expect(result.allowed).toBe(true);
    });

    it('should deny customer access to users resource', () => {
      const result = can(customer, 'read', 'users');
      expect(result.allowed).toBe(false);
    });

    it('should allow ops_admin to manage users', () => {
      const result = can(opsAdmin, 'manage', 'users');
      expect(result.allowed).toBe(true);
    });

    it('should allow super_admin to do anything', () => {
      expect(can(superAdmin, 'manage', 'trips').allowed).toBe(true);
      expect(can(superAdmin, 'manage', 'users').allowed).toBe(true);
      expect(can(superAdmin, 'manage', 'settings').allowed).toBe(true);
    });

    it('should deny access when no user', () => {
      const result = can(null, 'read', 'trips');
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('No authenticated user');
    });

    it('should respect ownOnly condition', () => {
      const result = can(customer, 'read', 'trips', { resourceOwnerId: 'other-user' });
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('own resources');
    });

    it('should allow access to own resources', () => {
      const result = can(customer, 'read', 'trips', { resourceOwnerId: customer.id });
      expect(result.allowed).toBe(true);
    });

    it('should respect tenantOnly condition', () => {
      const result = can(enterpriseUser, 'read', 'trips', { resourceTenantId: 'other-tenant' });
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('tenant');
    });

    it('should allow access to same tenant', () => {
      const result = can(enterpriseUser, 'read', 'trips', { resourceTenantId: 'tenant1' });
      expect(result.allowed).toBe(true);
    });
  });

  describe('hasRole() function', () => {
    it('should return true when user has exact role', () => {
      expect(hasRole(customer, ['customer'])).toBe(true);
    });

    it('should return true when user has one of multiple roles', () => {
      expect(hasRole(opsAdmin, ['customer', 'ops_admin'])).toBe(true);
    });

    it('should return false when user lacks role', () => {
      expect(hasRole(customer, ['ops_admin'])).toBe(false);
    });

    it('should return false for null user', () => {
      expect(hasRole(null, ['customer'])).toBe(false);
    });
  });

  describe('hasTenantAccess() function', () => {
    it('should allow user access to own tenant', () => {
      expect(hasTenantAccess(enterpriseUser, 'tenant1')).toBe(true);
    });

    it('should deny user access to other tenant', () => {
      expect(hasTenantAccess(enterpriseUser, 'other-tenant')).toBe(false);
    });

    it('should allow super_admin access to any tenant', () => {
      expect(hasTenantAccess(superAdmin, 'any-tenant')).toBe(true);
    });

    it('should allow ops_admin access to any tenant', () => {
      expect(hasTenantAccess(opsAdmin, 'any-tenant')).toBe(true);
    });
  });

  describe('isInRoleGroup() function', () => {
    it('should identify ops roles', () => {
      expect(isInRoleGroup(opsAdmin, 'ops')).toBe(true);
      expect(isInRoleGroup(customer, 'ops')).toBe(false);
    });

    it('should identify enterprise roles', () => {
      expect(isInRoleGroup(enterpriseUser, 'enterprise')).toBe(true);
      expect(isInRoleGroup(customer, 'enterprise')).toBe(false);
    });
  });
});
