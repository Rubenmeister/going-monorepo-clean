import { Injectable, Inject } from '@nestjs/common';
import { Result } from 'neverthrow';
import { 
  I_EXPERIENCE_REPOSITORY, 
  IExperienceRepository 
} from '@going-monorepo-clean/domains-experience-core';

@Injectable()
export class DeleteExperienceUseCase {
  constructor(
    @Inject(I_EXPERIENCE_REPOSITORY)
    private readonly experienceRepo: IExperienceRepository,
  ) {}

  async execute(id: string): Promise<Result<void, Error>> {
    return this.experienceRepo.delete(id);
  }
}
