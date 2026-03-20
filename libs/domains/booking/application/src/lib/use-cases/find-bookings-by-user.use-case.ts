import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  Booking,
  IBookingRepository,
} from '@going-monorepo-clean/domains-booking-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

@Injectable()
export class FindBookingsByUserUseCase {
  constructor(
    @Inject(IBookingRepository)
    private readonly bookingRepo: IBookingRepository,
  ) {}

  async execute(userId: UUID): Promise<any[]> {
    const result = await this.bookingRepo.findByUserId(userId);

    if (result.isErr()) {
      throw new InternalServerErrorException(result.error.message);
    }

    return result.value.map((booking) => booking.toPrimitives());
  }
}
