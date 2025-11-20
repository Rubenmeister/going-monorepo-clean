import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  Accommodation,
  IAccommodationRepository,
  Location,
} from '@going-monorepo-clean/domains-accommodation-core';
import { Money } from '@going-monorepo-clean/shared-domain';
import { CreateAccommodationDto } from '../dto/create-accommodation.dto';

@Injectable()
export class CreateAccommodationUseCase {
  constructor(
    @Inject(IAccommodationRepository)
    private readonly accommodationRepo: IAccommodationRepository,
  ) {}

  async execute(dto: CreateAccommodationDto): Promise<{ id: string }> {
    const locationVO = Location.create(dto.location)._unsafeUnwrap(); // Asumiendo DTO válido
    const priceVO = new Money(dto.pricePerNight.amount, dto.pricePerNight.currency);

    const accommodationResult = Accommodation.create({
      hostId: dto.hostId,
      title: dto.title,
      description: dto.description,
      location: locationVO,
      pricePerNight: priceVO,
      capacity: dto.capacity,
      amenities: dto.amenities,
    });

    if (accommodationResult.isErr()) {
      throw new InternalServerErrorException(accommodationResult.error.message);
    }
    const accommodation = accommodationResult.value;

    const saveResult = await this.accommodationRepo.save(accommodation);
    if (saveResult.isErr()) {
      throw new InternalServerErrorException(saveResult.error.message);
    }
    return { id: accommodation.id };
  }
}