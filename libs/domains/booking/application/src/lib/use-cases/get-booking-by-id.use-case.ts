import { Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { IBookingRepository, Booking } from '@going-monorepo-clean/domains-booking-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

@Injectable()
export class GetBookingByIdUseCase {
  constructor(
    @Inject(IBookingRepository)
    private readonly bookingRepo: IBookingRepository,
  ) {}

  async execute(id: UUID): Promise<Booking> {
    const result = await this.bookingRepo.findById(id);

    if (result.isErr()) {
      throw new InternalServerErrorException(result.error.message);
    }
    if (!result.value) {
      throw new NotFoundException(`Booking with ID ${id} not found.`);
    }
    return result.value;
  }
}
