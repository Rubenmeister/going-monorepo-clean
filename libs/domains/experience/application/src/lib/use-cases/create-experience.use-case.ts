import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  Experience,
  IExperienceRepository,
} from '@going-monorepo-clean/domains-experience-core';
import { Money, Location } from '@going-monorepo-clean/shared-domain';
import { CreateExperienceDto } from '../dto/create-experience.dto';

@Injectable()
export class CreateExperienceUseCase {
  constructor(
    @Inject(IExperienceRepository)
    private readonly experienceRepo: IExperienceRepository,
  ) {}

  async execute(dto: CreateExperienceDto): Promise<{ id: string }> {
    const locationVOResult = Location.create(dto.location);
    if (locationVOResult.isErr()) {
      throw new InternalServerErrorException(locationVOResult.error.message);
    }
    
    const locationVO = locationVOResult.value;
    const priceVO = new Money(dto.price.amount, dto.price.currency);

    const experienceResult = Experience.create({
      hostId: dto.hostId,
      title: dto.title,
      description: dto.description,
      location: locationVO,
      price: priceVO,
      durationHours: dto.durationHours,
    });

    if (experienceResult.isErr()) {
      throw new InternalServerErrorException(experienceResult.error.message);
    }
    const experience = experienceResult.value;

    const saveResult = await this.experienceRepo.save(experience);
    if (saveResult.isErr()) {
      throw new InternalServerErrorException(saveResult.error.message);
    }
    return { id: experience.id };
  }
}