import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { UUID } from '@going-monorepo-clean/shared-domain';

/**
 * Booking Service
 * Proxies booking operations to the real booking-service
 *
 * Delegates all CRUD operations to the booking-service backend
 * instead of using in-memory storage.
 */
@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);
  private readonly bookingServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    configService: ConfigService,
  ) {
    this.bookingServiceUrl = configService.get<string>(
      'BOOKING_SERVICE_URL',
      'http://localhost:3006'
    );
  }

  /**
   * List bookings with role-based filtering
   */
  async listBookings(
    userId: UUID,
    roles: string[],
    page: number,
    limit: number,
  ) {
    const isAdmin = roles.includes('admin');

    try {
      const endpoint = isAdmin ? '/bookings' : `/bookings/user/${userId}`;
      const response = await this.httpService
        .get(`${this.bookingServiceUrl}${endpoint}`, {
          params: { page, limit },
        })
        .toPromise();

      this.logger.debug(
        `User ${userId} (admin: ${isAdmin}) listed bookings`,
      );
      return response.data;
    } catch (error: any) {
      this.logger.error(
        `Failed to list bookings for ${userId}: ${error?.message}`,
      );
      throw new HttpException(
        'Failed to fetch bookings',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Get booking by ID
   */
  async getBooking(bookingId: UUID) {
    try {
      const response = await this.httpService
        .get(`${this.bookingServiceUrl}/bookings/${bookingId}`)
        .toPromise();

      this.logger.debug(`Retrieved booking ${bookingId}`);
      return response.data;
    } catch (error: any) {
      this.logger.error(
        `Failed to get booking ${bookingId}: ${error?.message}`,
      );
      if (error?.response?.status === 404) {
        return null;
      }
      throw new HttpException(
        'Failed to fetch booking',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Create new booking
   */
  async createBooking(userId: UUID, createBookingDto: any) {
    try {
      const response = await this.httpService
        .post(`${this.bookingServiceUrl}/bookings`, {
          userId,
          ...createBookingDto,
        })
        .toPromise();

      this.logger.log(
        `Created booking ${response.data.id} for user ${userId}`,
      );
      return response.data;
    } catch (error: any) {
      this.logger.error(
        `Failed to create booking for ${userId}: ${error?.message}`,
      );
      throw new HttpException(
        'Failed to create booking',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Update booking
   */
  async updateBooking(bookingId: UUID, updateBookingDto: any) {
    try {
      const response = await this.httpService
        .patch(`${this.bookingServiceUrl}/bookings/${bookingId}`, updateBookingDto)
        .toPromise();

      this.logger.log(`Updated booking ${bookingId}`);
      return response.data;
    } catch (error: any) {
      this.logger.error(
        `Failed to update booking ${bookingId}: ${error?.message}`,
      );
      if (error?.response?.status === 404) {
        return null;
      }
      throw new HttpException(
        'Failed to update booking',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Cancel booking
   */
  async cancelBooking(bookingId: UUID) {
    return this.updateBooking(bookingId, { status: 'cancelled' });
  }

  /**
   * Confirm booking (host operation)
   */
  async confirmBooking(bookingId: UUID) {
    return this.updateBooking(bookingId, { status: 'confirmed' });
  }

  /**
   * Force update booking status (admin operation)
   */
  async forceUpdateStatus(bookingId: UUID, status: string) {
    this.logger.warn(`Force updating booking ${bookingId} to status ${status}`);
    return this.updateBooking(bookingId, { status, forcedByAdmin: true });
  }

  /**
   * Check if user is host of accommodation
   */
  async isHostOfAccommodation(
    userId: UUID,
    accommodationId: UUID,
  ): Promise<boolean> {
    // In production: Query database
    // For now, return true for demonstration
    return true;
  }
}
