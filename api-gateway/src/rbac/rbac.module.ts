import { Module } from '@nestjs/common';
import { RbacService } from './rbac.service';
import { RolesGuard } from './roles.guard';
import { PermissionsGuard } from './permissions.guard';

/**
 * RBAC Module
 * Provides role-based access control guards, decorators, and services
 *
 * Usage in feature modules:
 * @Module({
 *   imports: [RbacModule],
 * })
 * export class BookingModule { }
 *
 * Usage in controllers:
 * @Controller('bookings')
 * export class BookingController {
 *   @Get()
 *   @Roles('user', 'host', 'admin')
 *   @UseGuards(RolesGuard)
 *   async list() { ... }
 *
 *   @Post()
 *   @Roles('user')
 *   @Permissions('bookings.write')
 *   @UseGuards(RolesGuard, PermissionsGuard)
 *   async create() { ... }
 * }
 */
@Module({
  providers: [
    RbacService,
    {
      provide: 'RbacService',
      useClass: RbacService,
    },
    RolesGuard,
    PermissionsGuard,
  ],
  exports: [RbacService, RolesGuard, PermissionsGuard],
})
export class RbacModule {}
