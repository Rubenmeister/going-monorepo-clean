/**
 * Permission Value Object
 * Represents a single permission in the system (read, write, delete, admin actions)
 */

export type ResourceType =
  | 'users'
  | 'accommodations'
  | 'bookings'
  | 'payments'
  | 'transport'
  | 'tracking'
  | 'experiences'
  | 'tours'
  | 'parcels'
  | 'notifications'
  | 'admin';

export type ActionType = 'read' | 'write' | 'delete' | 'admin';

export type PermissionType =
  // User permissions
  | 'users.read'
  | 'users.write'
  | 'users.delete'
  | 'users.manage_roles'
  // Accommodation permissions
  | 'accommodations.read'
  | 'accommodations.write'
  | 'accommodations.delete'
  | 'accommodations.publish'
  // Booking permissions
  | 'bookings.read'
  | 'bookings.write'
  | 'bookings.cancel'
  | 'bookings.confirm'
  // Payment permissions
  | 'payments.read'
  | 'payments.write'
  | 'payments.refund'
  // Transport/Trip permissions
  | 'transport.read'
  | 'transport.write'
  | 'transport.cancel'
  // Tracking permissions
  | 'tracking.read'
  | 'tracking.write'
  // Experience/Tour permissions
  | 'experiences.read'
  | 'experiences.write'
  | 'tours.read'
  | 'tours.write'
  // Parcel permissions
  | 'parcels.read'
  | 'parcels.write'
  | 'parcels.track'
  // Notification permissions
  | 'notifications.read'
  | 'notifications.send'
  // Admin permissions
  | 'admin.settings'
  | 'admin.users'
  | 'admin.analytics';

export class Permission {
  readonly value: PermissionType;
  readonly resource: ResourceType;
  readonly action: ActionType;

  private constructor(value: PermissionType, resource: ResourceType, action: ActionType) {
    this.value = value;
    this.resource = resource;
    this.action = action;
  }

  /**
   * Factory method to create a permission
   */
  static create(value: PermissionType): Permission {
    const [resource, action] = value.split('.') as [ResourceType, ActionType];

    if (!resource || !action) {
      throw new Error(`Invalid permission format: ${value}`);
    }

    return new Permission(value, resource, action);
  }

  /**
   * Check if permission matches a required resource and action
   */
  matches(resource: ResourceType, action: ActionType): boolean {
    return this.resource === resource && (
      this.action === 'admin' || // Admin action matches all
      this.action === action ||
      action === 'read' // Read includes read-only
    );
  }

  /**
   * Check if permission has action on resource
   */
  hasActionOn(resource: ResourceType, action: ActionType): boolean {
    return this.matches(resource, action);
  }

  /**
   * Convert to primitive representation
   */
  toPrimitive(): PermissionType {
    return this.value;
  }

  /**
   * Compare permissions
   */
  equals(other: Permission): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
