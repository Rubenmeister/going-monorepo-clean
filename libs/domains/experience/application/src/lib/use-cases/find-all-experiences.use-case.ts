import { Injectable, Inject } from '@nestjs/common';
import { Result } from 'neverthrow';
import { 
  Experience,
  I_EXPERIENCE_REPOSITORY, 
  IExperienceRepository 
} from '@going-monorepo-clean/domains-experience-core';

@Injectable()
export class FindAllExperiencesUseCase {
  constructor(
    @Inject(I_EXPERIENCE_REPOSITORY)
    private readonly experienceRepo: IExperienceRepository,
  ) {}

  async execute(): Promise<Result<Experience[], Error>> {
    return this.experienceRepo.findAll();
  }
}
