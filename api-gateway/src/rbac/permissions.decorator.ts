import { SetMetadata } from '@nestjs/common';
import { PermissionType } from '@going-monorepo-clean/shared-domain';

export const PERMISSIONS_KEY = 'permissions';

/**
 * @Permissions decorator
 * Marks a route to require specific permissions for access
 *
 * Usage:
 * @Post('accommodations')
 * @Permissions('accommodations.write')
 * async createAccommodation() { ... }
 *
 * @Patch('accommodations/:id')
 * @Permissions('accommodations.write')
 * async updateAccommodation() { ... }
 *
 * Can be combined with @Roles:
 * @Post('admin/users')
 * @Roles('admin')
 * @Permissions('admin.users')
 * async manageUsers() { ... }
 */
export const Permissions = (...permissions: PermissionType[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
