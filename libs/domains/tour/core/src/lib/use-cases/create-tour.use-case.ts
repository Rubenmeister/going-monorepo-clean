import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  Tour,
  ITourRepository,
} from '@going-monorepo-clean/domains-tour-core';
import { Money, Location } from '@going-monorepo-clean/shared-domain';
import { CreateTourDto } from '../dto/create-tour.dto';

@Injectable()
export class CreateTourUseCase {
  constructor(
    @Inject(ITourRepository)
    private readonly tourRepo: ITourRepository,
  ) {}

  async execute(dto: CreateTourDto): Promise<{ id: string }> {
    const locationVOResult = Location.create(dto.location);
    if (locationVOResult.isErr()) {
      throw new InternalServerErrorException(locationVOResult.error.message);
    }
    const locationVO = locationVOResult.value;
    const priceVO = new Money(dto.price.amount, dto.price.currency as 'USD');

    const tourResult = Tour.create({
      hostId: dto.hostId,
      title: dto.title,
      description: dto.description,
      location: locationVO,
      price: priceVO,
      durationHours: dto.durationHours,
      maxGuests: dto.maxGuests,
      category: dto.category,
    });

    if (tourResult.isErr()) {
      throw new InternalServerErrorException(tourResult.error.message);
    }
    const tour = tourResult.value;

    const saveResult = await this.tourRepo.save(tour);
    if (saveResult.isErr()) {
      throw new InternalServerErrorException(saveResult.error.message);
    }
    return { id: tour.id };
  }
}