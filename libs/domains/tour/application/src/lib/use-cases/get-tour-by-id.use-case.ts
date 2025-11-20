import { Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ITourRepository, Tour } from '@going-monorepo-clean/domains-tour-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

@Injectable()
export class GetTourByIdUseCase {
  constructor(
    @Inject(ITourRepository)
    private readonly repository: ITourRepository,
  ) {}

  async execute(id: UUID): Promise<Tour> {
    const result = await this.repository.findById(id);

    if (result.isErr()) {
      throw new InternalServerErrorException(result.error.message);
    }
    if (!result.value) {
      throw new NotFoundException(`Tour with ID ${id} not found.`);
    }
    return result.value;
  }
}