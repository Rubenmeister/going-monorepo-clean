import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  IExperienceRepository,
  ExperienceSearchFilters,
} from '@going-monorepo-clean/domains-experience-core';

@Injectable()
export class SearchExperiencesUseCase {
  constructor(
    @Inject(IExperienceRepository)
    private readonly experienceRepo: IExperienceRepository,
  ) {}

  async execute(filters: ExperienceSearchFilters): Promise<any[]> {
    const result = await this.experienceRepo.searchPublished(filters);

    if (result.isErr()) {
      throw new InternalServerErrorException(result.error.message);
    }

    return result.value.map((experience) => experience.toPrimitives());
  }
}
