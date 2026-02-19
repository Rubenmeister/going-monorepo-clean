import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Query,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CurrentUser } from '@going-monorepo-clean/shared-infrastructure';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../rbac/roles.guard';
import { PermissionsGuard } from '../../rbac/permissions.guard';
import { Roles } from '../../rbac/roles.decorator';
import { Permissions } from '../../rbac/permissions.decorator';
import { UUID } from '@going-monorepo-clean/shared-domain';
import { BookingService } from './booking.service';

/**
 * Booking Controller
 * Example of RBAC-protected endpoints
 *
 * RBAC Patterns:
 * 1. @Roles('user', 'host') - Multiple roles (OR logic)
 * 2. @Permissions('bookings.read') - Specific permissions
 * 3. @Roles + @Permissions - Both checks (AND logic)
 *
 * Usage:
 * - @UseGuards(JwtAuthGuard) - Require authentication
 * - @UseGuards(JwtAuthGuard, RolesGuard) - Require specific roles
 * - @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard) - Roles + permissions
 */
@Controller('bookings')
export class BookingController {
  private readonly logger = new Logger(BookingController.name);

  constructor(private bookingService: BookingService) {}

  /**
   * List Bookings
   * GET /bookings
   *
   * RBAC:
   * - Requires authentication (JwtAuthGuard)
   * - Any authenticated user can list
   * - Results filtered by user's role (user sees own, host sees own, admin sees all)
   *
   * Permission: bookings.read
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  @Permissions('bookings.read')
  async listBookings(
    @CurrentUser('userId') userId: UUID,
    @CurrentUser('roles') roles: string[],
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    this.logger.debug(
      `User ${userId} (roles: ${roles.join(',')}) listing bookings`,
    );

    // Service will filter results based on user role
    return this.bookingService.listBookings(userId, roles, page, limit);
  }

  /**
   * Get Booking by ID
   * GET /bookings/:id
   *
   * RBAC:
   * - Requires authentication
   * - Permission: bookings.read
   * - Data access: Only own bookings, unless admin
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @Permissions('bookings.read')
  async getBooking(
    @Param('id') bookingId: UUID,
    @CurrentUser('userId') userId: UUID,
    @CurrentUser('roles') roles: string[],
  ) {
    this.logger.debug(`User ${userId} accessing booking ${bookingId}`);

    const booking = await this.bookingService.getBooking(bookingId);

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Check access: owner or admin
    const isAdmin = roles.includes('admin');
    const isOwner = booking.userId === userId;

    if (!isAdmin && !isOwner) {
      this.logger.warn(
        `Access denied: User ${userId} tried to access booking ${bookingId}`,
      );
      throw new ForbiddenException('Cannot access this booking');
    }

    return booking;
  }

  /**
   * Create Booking
   * POST /bookings
   *
   * RBAC:
   * - Requires authentication + user or host role
   * - Permission: bookings.write
   * - Only users and hosts can create bookings
   *
   * Example usage:
   * @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
   * @Roles('user', 'host')
   * @Permissions('bookings.write')
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('user', 'host') // Either user or host
  @Permissions('bookings.write')
  async createBooking(
    @CurrentUser('userId') userId: UUID,
    @CurrentUser('email') email: string,
    @Body() createBookingDto: any,
  ) {
    this.logger.debug(
      `User ${userId} (${email}) creating new booking`,
    );

    return this.bookingService.createBooking(userId, createBookingDto);
  }

  /**
   * Update Booking
   * PATCH /bookings/:id
   *
   * RBAC:
   * - Requires authentication
   * - Permission: bookings.write
   * - Data access: Only own bookings, unless admin
   * - Admins can update any booking
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Permissions('bookings.write')
  async updateBooking(
    @Param('id') bookingId: UUID,
    @CurrentUser('userId') userId: UUID,
    @CurrentUser('roles') roles: string[],
    @Body() updateBookingDto: any,
  ) {
    this.logger.debug(`User ${userId} updating booking ${bookingId}`);

    const booking = await this.bookingService.getBooking(bookingId);

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Check authorization
    const isAdmin = roles.includes('admin');
    const isOwner = booking.userId === userId;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('Cannot update this booking');
    }

    return this.bookingService.updateBooking(bookingId, updateBookingDto);
  }

  /**
   * Cancel Booking
   * DELETE /bookings/:id
   *
   * RBAC:
   * - Requires authentication
   * - Permission: bookings.cancel
   * - Data access: Only own bookings, unless admin
   * - Different permission than update (cancel vs write)
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Permissions('bookings.cancel')
  async cancelBooking(
    @Param('id') bookingId: UUID,
    @CurrentUser('userId') userId: UUID,
    @CurrentUser('roles') roles: string[],
  ) {
    this.logger.debug(`User ${userId} canceling booking ${bookingId}`);

    const booking = await this.bookingService.getBooking(bookingId);

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Check authorization
    const isAdmin = roles.includes('admin');
    const isOwner = booking.userId === userId;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('Cannot cancel this booking');
    }

    return this.bookingService.cancelBooking(bookingId);
  }

  /**
   * Confirm Booking
   * POST /bookings/:id/confirm
   *
   * RBAC:
   * - Requires host role exclusively
   * - Permission: bookings.confirm
   * - Only the host (accommodation owner) can confirm bookings
   *
   * Pattern: Role-based access (not permission-based)
   */
  @Post(':id/confirm')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('host') // Only hosts can confirm
  @Permissions('bookings.confirm')
  async confirmBooking(
    @Param('id') bookingId: UUID,
    @CurrentUser('userId') userId: UUID,
  ) {
    this.logger.debug(`Host ${userId} confirming booking ${bookingId}`);

    const booking = await this.bookingService.getBooking(bookingId);

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Verify the user is the host (accommodation owner)
    const isHostOfAccommodation =
      await this.bookingService.isHostOfAccommodation(
        userId,
        booking.accommodationId,
      );

    if (!isHostOfAccommodation) {
      throw new ForbiddenException(
        'You are not the host of this accommodation',
      );
    }

    return this.bookingService.confirmBooking(bookingId);
  }

  /**
   * Admin: Force Update Booking Status
   * PATCH /bookings/:id/admin/status
   *
   * RBAC:
   * - Requires admin role exclusively
   * - Permission: admin.users or admin.settings (admin actions)
   * - Only admins can force update booking status
   *
   * Pattern: Admin-only endpoint
   */
  @Patch(':id/admin/status')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('admin') // Only admin
  @Permissions('admin.settings')
  async adminUpdateBookingStatus(
    @Param('id') bookingId: UUID,
    @CurrentUser('userId') userId: UUID,
    @Body('status') status: string,
  ) {
    this.logger.warn(
      `Admin ${userId} force-updating booking ${bookingId} status to ${status}`,
    );

    return this.bookingService.forceUpdateStatus(bookingId, status);
  }
}
