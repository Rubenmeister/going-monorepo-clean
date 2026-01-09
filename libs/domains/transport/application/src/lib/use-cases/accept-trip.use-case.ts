import { Inject, Injectable, InternalServerErrorException, NotFoundException, PreconditionFailedException } from '@nestjs/common';
import { ITripRepository } from '@going-monorepo-clean/domains-transport-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

@Injectable()
export class AcceptTripUseCase {
  constructor(
    @Inject(ITripRepository)
    private readonly tripRepo: ITripRepository,
  ) {}

  async execute(tripId: UUID, driverId: UUID): Promise<void> {
    const result = await this.tripRepo.findById(tripId);
    
    const trip = result.match(
      (t) => t,
      (error) => {
        throw new NotFoundException(`Trip with id ${tripId} not found: ${error.message}`);
      }
    );

    try {
      trip.assignDriver(driverId);
    } catch (error) {
      throw new PreconditionFailedException((error as Error).message);
    }

    const saveResult = await this.tripRepo.save(trip);
    if (saveResult.isErr()) {
      throw new InternalServerErrorException(`Failed to save trip: ${saveResult.error.message}`);
    }
  }
}
