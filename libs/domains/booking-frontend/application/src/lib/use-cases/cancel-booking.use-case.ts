import { Inject, Injectable, InternalServerErrorException, NotFoundException, ConflictException } from '@nestjs/common';
import { IBookingRepository } from '@going-monorepo-clean/domains-booking-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

@Injectable()
export class CancelBookingUseCase {
  constructor(
    @Inject(IBookingRepository)
    private readonly repository: IBookingRepository,
  ) {}

  async execute(bookingId: UUID): Promise<void> {
    const result = await this.repository.findById(bookingId);

    if (result.isErr()) {
      throw new InternalServerErrorException(result.error.message);
    }
    if (!result.value) {
      throw new NotFoundException(`Booking with ID ${bookingId} not found.`);
    }
    
    const booking = result.value;

    // Lógica de cancelación en la entidad
    const cancelResult = booking.cancel();

    if (cancelResult.isErr()) {
        throw new ConflictException(cancelResult.error.message);
    }

    // Actualizar el repositorio
    await this.repository.update(booking);
  }
}