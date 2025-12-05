import { Inject, Injectable } from '@nestjs/common';
import { ITourRepository, Tour } from '@going-monorepo-clean/domains-tour-core';
import { CreateTourDto } from '../dto/create-tour.dto';

@Injectable()
export class CreateTourUseCase {
  constructor(
    @Inject(ITourRepository)
    private readonly tourRepo: ITourRepository,
  ) {}

  async execute(dto: CreateTourDto): Promise<{ id: string }> {
    const tour = Tour.create({
      hostId: dto.hostId,
      title: dto.title,
      description: dto.description,
      pricePerPerson: dto.pricePerPerson,
      currency: dto.currency,
      maxCapacity: dto.maxCapacity,
      durationHours: dto.durationHours,
      location: dto.location,
      meetingPoint: dto.meetingPoint,
    });

    await this.tourRepo.save(tour);

    return { id: tour.id };
  }
}
