import { Injectable, Inject } from '@nestjs/common';
import { Result, ok, err } from 'neverthrow';
import { 
  Experience, 
  I_EXPERIENCE_REPOSITORY, 
  IExperienceRepository,
  ExperienceSearchFilters,
} from '@going-monorepo-clean/domains-experience-core';
import { SearchExperiencesDto } from '../dto/search-experiences.dto';

@Injectable()
export class SearchExperiencesUseCase {
  constructor(
    @Inject(I_EXPERIENCE_REPOSITORY)
    private readonly experienceRepo: IExperienceRepository,
  ) {}

  async execute(dto: SearchExperiencesDto): Promise<Result<Experience[], Error>> {
    const filters: ExperienceSearchFilters = {
      locationCity: dto.city,
      maxPrice: dto.maxPrice,
    };

    return this.experienceRepo.searchPublished(filters);
  }
}
