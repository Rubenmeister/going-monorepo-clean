import { Inject, Injectable, InternalServerErrorException, NotFoundException, PreconditionFailedException } from '@nestjs/common';
import { IBookingRepository } from '@going-monorepo-clean/domains-booking-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

@Injectable()
export class CancelBookingUseCase {
  constructor(
    @Inject(IBookingRepository)
    private readonly bookingRepo: IBookingRepository,
  ) {}

  async execute(bookingId: UUID): Promise<void> {
    const result = await this.bookingRepo.findById(bookingId);

    if (result.isErr()) {
      throw new InternalServerErrorException(result.error.message);
    }
    if (!result.value) {
      throw new NotFoundException(`Booking with id ${bookingId} not found`);
    }

    const booking = result.value;
    const cancelResult = booking.cancel();

    if (cancelResult.isErr()) {
      throw new PreconditionFailedException(cancelResult.error.message);
    }

    const updateResult = await this.bookingRepo.update(booking);
    if (updateResult.isErr()) {
      throw new InternalServerErrorException(updateResult.error.message);
    }
  }
}
