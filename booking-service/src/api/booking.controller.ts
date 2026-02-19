import { Controller, Post, Body, Get, Param, Patch } from '@nestjs/common';
import {
  CreateBookingDto,
  CreateBookingUseCase,
  FindBookingsByUserUseCase,
  ConfirmBookingUseCase,
  CancelBookingUseCase,
} from '@going-monorepo-clean/domains-booking-application';
import { UUID } from '@going-monorepo-clean/shared-domain';

@Controller('bookings')
export class BookingController {
  constructor(
    private readonly createBookingUseCase: CreateBookingUseCase,
    private readonly findBookingsByUserUseCase: FindBookingsByUserUseCase,
    private readonly confirmBookingUseCase: ConfirmBookingUseCase,
    private readonly cancelBookingUseCase: CancelBookingUseCase,
  ) {}

  @Post()
  async createBooking(@Body() dto: CreateBookingDto): Promise<any> {
    return this.createBookingUseCase.execute(dto);
  }

  @Get('user/:userId')
  async getBookingsByUser(@Param('userId') userId: UUID): Promise<any> {
    return this.findBookingsByUserUseCase.execute(userId);
  }

  @Patch(':bookingId/confirm')
  async confirmBooking(@Param('bookingId') bookingId: UUID): Promise<any> {
    return this.confirmBookingUseCase.execute(bookingId);
  }

  @Patch(':bookingId/cancel')
  async cancelBooking(@Param('bookingId') bookingId: UUID): Promise<any> {
    return this.cancelBookingUseCase.execute(bookingId);
  }
}
