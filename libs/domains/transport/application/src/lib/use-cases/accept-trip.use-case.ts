import { Inject, Injectable, InternalServerErrorException, NotFoundException, PreconditionFailedException } from '@nestjs/common';
import {
  ITripRepository,
} from '@going-monorepo-clean/domains-transport-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

@Injectable()
export class AcceptTripUseCase {
  constructor(
    @Inject(ITripRepository)
    private readonly tripRepo: ITripRepository,
  ) {}

  async execute(tripId: UUID, driverId: UUID): Promise<void> {
    const tripResult = await this.tripRepo.findById(tripId);
    
    if (tripResult.isErr()) {
      throw new InternalServerErrorException(tripResult.error.message);
    }
    if (!tripResult.value) {
      throw new NotFoundException(`Trip with id ${tripId} not found`);
    }

    const trip = tripResult.value;
    const assignResult = trip.assignDriver(driverId);

    if (assignResult.isErr()) {
      throw new PreconditionFailedException(assignResult.error.message);
    }

    const updateResult = await this.tripRepo.update(trip);

    if (updateResult.isErr()) {
      throw new InternalServerErrorException(updateResult.error.message);
    }
  }
}