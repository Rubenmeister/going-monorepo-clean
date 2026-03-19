import { SetMetadata } from '@nestjs/common';
import { AuditActionType, ResourceType } from '@going-monorepo-clean/domains-audit-core';

export const AUDIT_ACTION_KEY = 'audit:action';
export const AUDIT_RESOURCE_KEY = 'audit:resource';

/**
 * @Audit(action, resourceType)
 *
 * Marks a controller method for automatic audit logging.
 * The AuditInterceptor reads these metadata values to record the event.
 *
 * @example
 * @Post('bookings')
 * @Audit('CREATE', 'bookings')
 * async createBooking() {}
 *
 * @example
 * @Patch('bookings/:id')
 * @Audit('UPDATE', 'bookings')
 * async updateBooking() {}
 *
 * @example
 * @Delete('bookings/:id')
 * @Audit('DELETE', 'bookings')
 * async deleteBooking() {}
 */
export const Audit = (
  action: AuditActionType,
  resourceType: ResourceType,
) =>
  // Compose two SetMetadata decorators
  (target: object, key: string | symbol, descriptor: PropertyDescriptor) => {
    SetMetadata(AUDIT_ACTION_KEY, action)(target, key, descriptor);
    SetMetadata(AUDIT_RESOURCE_KEY, resourceType)(target, key, descriptor);
    return descriptor;
  };
