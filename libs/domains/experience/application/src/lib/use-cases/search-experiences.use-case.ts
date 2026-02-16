import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { IExperienceRepository, ExperienceSearchFilters } from '@going-monorepo-clean/domains-experience-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

export type ExperienceSearchResultDto = {
  id: UUID;
  title: string;
  city: string;
  country: string;
  price: number;
  currency: string;
  durationHours: number;
};

@Injectable()
export class SearchExperiencesUseCase {
  constructor(
    @Inject(IExperienceRepository)
    private readonly experienceRepo: IExperienceRepository,
  ) {}

  async execute(filters: ExperienceSearchFilters): Promise<ExperienceSearchResultDto[]> {
    const result = await this.experienceRepo.searchPublished(filters);

    if (result.isErr()) {
      throw new InternalServerErrorException(result.error.message);
    }

    return result.value.map((exp) => {
      const p = exp.toPrimitives();
      return {
        id: p.id,
        title: p.title,
        city: p.location.city,
        country: p.location.country,
        price: p.price.amount,
        currency: p.price.currency,
        durationHours: p.durationHours,
      };
    });
  }
}
