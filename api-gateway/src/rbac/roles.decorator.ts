import { SetMetadata } from '@nestjs/common';
import { RoleType } from '@going-monorepo-clean/shared-domain';

export const ROLES_KEY = 'roles';

/**
 * @Roles decorator
 * Marks a route to require specific roles for access
 *
 * Usage:
 * @Post('admin')
 * @Roles('admin')
 * async adminEndpoint() { ... }
 *
 * @Post('host-only')
 * @Roles('host', 'admin')
 * async hostEndpoint() { ... }
 */
export const Roles = (...roles: RoleType[]) =>
  SetMetadata(ROLES_KEY, roles);
