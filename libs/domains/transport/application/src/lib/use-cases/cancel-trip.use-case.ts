import { Inject, Injectable, InternalServerErrorException, NotFoundException, PreconditionFailedException } from '@nestjs/common';
import { ITripRepository } from '@going-monorepo-clean/domains-transport-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

@Injectable()
export class CancelTripUseCase {
  constructor(
    @Inject(ITripRepository)
    private readonly tripRepo: ITripRepository,
  ) {}

  async execute(tripId: UUID): Promise<void> {
    const tripResult = await this.tripRepo.findById(tripId);

    if (tripResult.isErr()) {
      throw new InternalServerErrorException(tripResult.error.message);
    }
    if (!tripResult.value) {
      throw new NotFoundException(`Trip with id ${tripId} not found`);
    }

    const trip = tripResult.value;
    const cancelResult = trip.cancel();

    if (cancelResult.isErr()) {
      throw new PreconditionFailedException(cancelResult.error.message);
    }

    const updateResult = await this.tripRepo.update(trip);
    if (updateResult.isErr()) {
      throw new InternalServerErrorException(updateResult.error.message);
    }
  }
}
