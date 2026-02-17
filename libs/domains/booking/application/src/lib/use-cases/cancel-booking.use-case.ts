import { Inject, Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import {
  Booking,
  IBookingRepository,
} from '@going-monorepo-clean/domains-booking-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

@Injectable()
export class CancelBookingUseCase {
  constructor(
    @Inject(IBookingRepository)
    private readonly bookingRepo: IBookingRepository,
  ) {}

  async execute(bookingId: UUID): Promise<{ status: string; message: string }> {
    // Find the booking
    const findResult = await this.bookingRepo.findById(bookingId);

    if (findResult.isErr()) {
      throw new InternalServerErrorException(findResult.error.message);
    }

    const booking = findResult.value;
    if (!booking) {
      throw new BadRequestException('Booking not found');
    }

    // Cancel the booking
    const cancelResult = booking.cancel();
    if (cancelResult.isErr()) {
      throw new BadRequestException(cancelResult.error.message);
    }

    // Save the updated booking
    const saveResult = await this.bookingRepo.save(booking);

    if (saveResult.isErr()) {
      throw new InternalServerErrorException(saveResult.error.message);
    }

    return {
      status: booking.status,
      message: 'Booking cancelled successfully',
    };
  }
}
