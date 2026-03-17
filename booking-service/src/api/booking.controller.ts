import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  NotFoundException,
  UseGuards,
  Inject,
} from '@nestjs/common';
import {
  CreateBookingDto,
  CreateBookingUseCase,
  FindBookingsByUserUseCase,
  ConfirmBookingUseCase,
  CancelBookingUseCase,
} from '@going-monorepo-clean/domains-booking-application';
import { IBookingRepository } from '@going-monorepo-clean/domains-booking-core';
import { UUID } from '@going-monorepo-clean/shared-domain';
import { JwtAuthGuard, CurrentUser } from '../domain/ports';

interface AuthUser {
  id: string;
  email: string;
  role: 'user' | 'driver' | 'admin';
}

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingController {
  constructor(
    private readonly createBookingUseCase: CreateBookingUseCase,
    private readonly findBookingsByUserUseCase: FindBookingsByUserUseCase,
    private readonly confirmBookingUseCase: ConfirmBookingUseCase,
    private readonly cancelBookingUseCase: CancelBookingUseCase,
    @Inject(IBookingRepository)
    private readonly bookingRepo: IBookingRepository,
  ) {}

  /**
   * POST /api/bookings
   * userId always comes from the JWT — never trusted from body
   */
  @Post()
  async createBooking(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateBookingDto,
  ): Promise<any> {
    return this.createBookingUseCase.execute({ ...dto, userId: user.id });
  }

  /**
   * GET /api/bookings/my
   * Returns bookings for the authenticated user
   */
  @Get('my')
  async getMyBookings(@CurrentUser() user: AuthUser): Promise<any> {
    return this.findBookingsByUserUseCase.execute(user.id as UUID);
  }

  /**
   * GET /api/bookings/user/:userId
   * Returns bookings for a specific user (admin / internal use)
   */
  @Get('user/:userId')
  async getBookingsByUser(@Param('userId') userId: UUID): Promise<any> {
    return this.findBookingsByUserUseCase.execute(userId);
  }

  /**
   * GET /api/bookings/:bookingId
   * Returns a single booking by ID
   */
  @Get(':bookingId')
  async getBookingById(@Param('bookingId') bookingId: UUID): Promise<any> {
    const result = await this.bookingRepo.findById(bookingId);
    if (result.isErr()) throw result.error;
    if (!result.value) throw new NotFoundException('Booking not found');
    return result.value.toPrimitives();
  }

  /**
   * PATCH /api/bookings/:bookingId/confirm
   */
  @Patch(':bookingId/confirm')
  async confirmBooking(@Param('bookingId') bookingId: UUID): Promise<any> {
    return this.confirmBookingUseCase.execute(bookingId);
  }

  /**
   * PATCH /api/bookings/:bookingId/cancel
   */
  @Patch(':bookingId/cancel')
  async cancelBooking(@Param('bookingId') bookingId: UUID): Promise<any> {
    return this.cancelBookingUseCase.execute(bookingId);
  }
}
