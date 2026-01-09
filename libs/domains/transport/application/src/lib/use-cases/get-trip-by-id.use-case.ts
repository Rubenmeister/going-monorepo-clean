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
    const result = await this.repository.findById(id);

    return result.match(
      (trip) => trip,
      (error) => {
        throw new NotFoundException(`Trip with ID ${id} not found: ${error.message}`);
      }
    );
  }
}
