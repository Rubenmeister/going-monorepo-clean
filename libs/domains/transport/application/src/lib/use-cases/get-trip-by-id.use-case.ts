import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ITripRepository, Trip } from '@going-monorepo-clean/domains-transport-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

@Injectable()
export class GetTripByIdUseCase {
  constructor(
    @Inject(ITripRepository)
    private readonly repository: ITripRepository,
  ) {}

  async execute(id: UUID): Promise<Trip> {
    const trip = await this.repository.findById(id);

    if (!trip) {
      throw new NotFoundException(`Trip with ID ${id} not found.`);
    }
    
    return trip;
  }
}