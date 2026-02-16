import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  ITripRepository,
  Trip,
} from '@going-monorepo-clean/domains-transport-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

@Injectable()
export class GetActiveTripByUserUseCase {
  constructor(
    @Inject(ITripRepository)
    private readonly tripRepo: ITripRepository,
  ) {}

  async execute(userId: UUID): Promise<Trip | null> {
    const result = await this.tripRepo.findTripsByUser(userId);

    if (result.isErr()) {
      throw new InternalServerErrorException(result.error.message);
    }

    const activeTrip = result.value.find(
      (trip) =>
        trip.status === 'pending' ||
        trip.status === 'driver_assigned' ||
        trip.status === 'in_progress',
    );

    return activeTrip ?? null;
  }
}
