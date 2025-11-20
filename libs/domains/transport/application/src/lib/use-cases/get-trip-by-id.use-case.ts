import { Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
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

    if (result.isErr()) {
      throw new InternalServerErrorException(result.error.message);
    }
    if (!result.value) {
      throw new NotFoundException(`Trip with ID ${id} not found.`);
    }
    return result.value;
  }
}