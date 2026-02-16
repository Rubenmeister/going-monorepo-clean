import { Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { IExperienceRepository, Experience } from '@going-monorepo-clean/domains-experience-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

@Injectable()
export class GetExperienceByIdUseCase {
  constructor(
    @Inject(IExperienceRepository)
    private readonly experienceRepo: IExperienceRepository,
  ) {}

  async execute(id: UUID): Promise<Experience> {
    const result = await this.experienceRepo.findById(id);

    if (result.isErr()) {
      throw new InternalServerErrorException(result.error.message);
    }
    if (!result.value) {
      throw new NotFoundException(`Experience with ID ${id} not found.`);
    }
    return result.value;
  }
}
