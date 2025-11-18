import { Inject, Injectable } from '@nestjs/common';
import { Result } from 'neverthrow';
import {
  Experience,
  IExperienceRepository,
  ExperienceFilters
} from '@going-monorepo-clean/domains-experience-frontend-core';

@Injectable()
export class SearchExperiencesUseCase {
  constructor(
    @Inject(IExperienceRepository)
    private readonly repository: IExperienceRepository
  ) {}

  async execute(filters: SearchExperienceDto): Promise<Result<Experience[], Error>> {
    return this.repository.search(filters as ExperienceFilters);
  }
}