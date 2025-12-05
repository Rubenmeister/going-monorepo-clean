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
    try {
      // UUID is string alias, so use it directly
      const trip = await this.tripRepo.findById(tripId);
      
      if (!trip) {
        throw new NotFoundException(`Trip with id ${tripId} not found`);
      }

      try {
        trip.assignDriver(driverId);
      } catch (error) {
        throw new PreconditionFailedException(error.message);
      }

      await this.tripRepo.update(trip);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof PreconditionFailedException) {
        throw error;
      }
      throw new InternalServerErrorException(error.message);
    }
  }
}