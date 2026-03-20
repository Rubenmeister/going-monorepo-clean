import { Permission, PermissionType } from './permission.vo';

/**
 * Role Type
 * Defines the role hierarchy in the system
 */
export type RoleType = 'admin' | 'host' | 'driver' | 'user';

/**
 * Role Value Object
 * Represents a role with its associated permissions
 */
export class Role {
  readonly value: RoleType;
  readonly displayName: string;
  readonly permissions: Permission[];
  readonly hierarchy: number; // Higher = more privileged

  private constructor(
    value: RoleType,
    displayName: string,
    permissions: Permission[],
    hierarchy: number,
  ) {
    this.value = value;
    this.displayName = displayName;
    this.permissions = permissions;
    this.hierarchy = hierarchy;
  }

  /**
   * Factory method to create a role with full permission matrix
   */
  static create(value: RoleType): Role {
    const config = ROLE_HIERARCHY[value];

    if (!config) {
      throw new Error(`Unknown role: ${value}`);
    }

    const permissions = config.permissions.map(perm => Permission.create(perm));

    return new Role(
      value,
      config.displayName,
      permissions,
      config.hierarchy,
    );
  }

  /**
   * Check if this role has a specific permission
   */
  hasPermission(permission: PermissionType): boolean {
    return this.permissions.some(p => p.value === permission);
  }

  /**
   * Check if this role can perform an action on a resource
   */
  canAccess(resource: string, action: string): boolean {
    return this.permissions.some(p =>
      p.hasActionOn(resource as any, action as any),
    );
  }

  /**
   * Get all permission values for this role
   */
  getPermissions(): PermissionType[] {
    return this.permissions.map(p => p.toPrimitive());
  }

  /**
   * Check if this role has higher or equal hierarchy than another
   */
  isHigherOrEqual(other: Role): boolean {
    return this.hierarchy >= other.hierarchy;
  }

  /**
   * Admin role check
   */
  isAdmin(): boolean {
    return this.value === 'admin';
  }

  /**
   * Convert to primitive representation
   */
  toPrimitive(): RoleType {
    return this.value;
  }

  toString(): string {
    return this.displayName;
  }
}

/**
 * Role Hierarchy and Permission Matrix
 * Defines the complete role-based access control structure
 */
export const ROLE_HIERARCHY: Record<
  RoleType,
  {
    displayName: string;
    hierarchy: number;
    permissions: PermissionType[];
    description: string;
  }
> = {
  admin: {
    displayName: 'Administrator',
    hierarchy: 100,
    description: 'Full system access',
    permissions: [
      // User management
      'users.read',
      'users.write',
      'users.delete',
      'users.manage_roles',
      // All resource management
      'accommodations.read',
      'accommodations.write',
      'accommodations.delete',
      'accommodations.publish',
      'bookings.read',
      'bookings.write',
      'bookings.cancel',
      'bookings.confirm',
      'payments.read',
      'payments.write',
      'payments.refund',
      'transport.read',
      'transport.write',
      'transport.cancel',
      'tracking.read',
      'tracking.write',
      'experiences.read',
      'experiences.write',
      'tours.read',
      'tours.write',
      'parcels.read',
      'parcels.write',
      'parcels.track',
      'notifications.read',
      'notifications.send',
      // Admin panel
      'admin.settings',
      'admin.users',
      'admin.analytics',
    ],
  },

  host: {
    displayName: 'Host',
    hierarchy: 75,
    description: 'Accommodation/experience provider',
    permissions: [
      // User profile
      'users.read',
      // Own accommodation management
      'accommodations.read',
      'accommodations.write',
      'accommodations.publish',
      // Booking management
      'bookings.read',
      'bookings.confirm',
      'bookings.cancel',
      // Payment info
      'payments.read',
      // Experience management
      'experiences.read',
      'experiences.write',
      'tours.read',
      'tours.write',
      // Notifications
      'notifications.read',
    ],
  },

  driver: {
    displayName: 'Driver',
    hierarchy: 50,
    description: 'Transportation/delivery provider',
    permissions: [
      // User profile
      'users.read',
      // Transport operations
      'transport.read',
      'transport.write',
      // Location tracking
      'tracking.read',
      'tracking.write',
      // Parcel tracking
      'parcels.read',
      'parcels.track',
      // Notifications
      'notifications.read',
    ],
  },

  user: {
    displayName: 'User',
    hierarchy: 10,
    description: 'Regular platform user',
    permissions: [
      // User profile
      'users.read',
      // Browse services
      'accommodations.read',
      'experiences.read',
      'tours.read',
      'transport.read',
      // Book services
      'bookings.read',
      'bookings.write',
      'bookings.cancel',
      // Payment info
      'payments.read',
      // Parcel tracking
      'parcels.read',
      'parcels.track',
      // Notifications
      'notifications.read',
    ],
  },
};

/**
 * Helper function to get all roles
 */
export function getAllRoles(): Role[] {
  return Object.keys(ROLE_HIERARCHY).map(role =>
    Role.create(role as RoleType),
  );
}

/**
 * Helper function to get role by type
 */
export function getRoleByType(type: RoleType): Role {
  return Role.create(type);
}
