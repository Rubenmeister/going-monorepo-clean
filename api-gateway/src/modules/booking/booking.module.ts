import { Module } from '@nestjs/common';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { AuthModule } from '../../auth/auth.module';
import { RbacModule } from '../../rbac/rbac.module';

/**
 * Booking Module
 * Example module showing RBAC integration
 *
 * Protected Routes:
 * - GET /bookings - List bookings (authenticated)
 * - GET /bookings/:id - View booking (authenticated + permission check)
 * - POST /bookings - Create booking (user/host role required)
 * - PATCH /bookings/:id - Update booking (owner or admin)
 * - DELETE /bookings/:id - Cancel booking (owner or admin)
 * - POST /bookings/:id/confirm - Confirm booking (host only)
 */
@Module({
  imports: [AuthModule, RbacModule],
  controllers: [BookingController],
  providers: [BookingService],
})
export class BookingModule {}
