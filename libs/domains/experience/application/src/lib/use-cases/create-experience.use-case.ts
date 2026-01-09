import { Injectable, Inject, InternalServerErrorException } from '@nestjs/common';
import { Result, ok, err } from 'neverthrow';
import { 
  Experience, 
  I_EXPERIENCE_REPOSITORY, 
  IExperienceRepository 
} from '@going-monorepo-clean/domains-experience-core';
import { CreateExperienceDto } from '../dto/create-experience.dto';

@Injectable()
export class CreateExperienceUseCase {
  constructor(
    @Inject(I_EXPERIENCE_REPOSITORY)
    private readonly experienceRepo: IExperienceRepository,
  ) {}

  async execute(dto: CreateExperienceDto): Promise<Result<Experience, Error>> {
    const experienceResult = Experience.create({
      hostId: dto.hostId as any,
      title: dto.title,
      description: dto.description,
      pricePerPerson: dto.price.amount,
      currency: dto.price.currency,
      durationHours: dto.durationHours,
      maxCapacity: dto.maxCapacity,
      location: dto.location.address,
    });

    if (experienceResult.isErr()) {
      return err(experienceResult.error);
    }

    const experience = experienceResult.value;
    const saveResult = await this.experienceRepo.save(experience);

    if (saveResult.isErr()) {
      return err(saveResult.error);
    }

    return ok(experience);
  }
}