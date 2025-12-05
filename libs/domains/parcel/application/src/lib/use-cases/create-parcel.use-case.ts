import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  Parcel,
  IParcelRepository,
  I_PARCEL_REPOSITORY,
} from '@going-monorepo-clean/domains-parcel-core';
import { Money, Location } from '@going-monorepo-clean/shared-domain';
import { CreateParcelDto } from '../dto/create-parcel.dto';

@Injectable()
export class CreateParcelUseCase {
  constructor(
    @Inject(I_PARCEL_REPOSITORY)
    private readonly parcelRepo: IParcelRepository,
  ) {}

  async execute(dto: CreateParcelDto): Promise<{ id: string }> {
    // Use Money.create() factory method
    const priceResult = Money.create(dto.price.amount, dto.price.currency);
    if (priceResult.isErr()) {
      throw new InternalServerErrorException(priceResult.error.message);
    }
    
    const originVOResult = Location.create(dto.origin);
    const destinationVOResult = Location.create(dto.destination);

    if (originVOResult.isErr()) {
      throw new InternalServerErrorException(originVOResult.error.message);
    }
    if (destinationVOResult.isErr()) {
      throw new InternalServerErrorException(destinationVOResult.error.message);
    }

    const parcelResult = Parcel.create({
      userId: dto.userId,
      origin: originVOResult.value,
      destination: destinationVOResult.value,
      description: dto.description,
      price: priceResult.value,
    });

    if (parcelResult.isErr()) {
      throw new InternalServerErrorException(parcelResult.error.message);
    }

    const parcel = parcelResult.value;
    const saveResult = await this.parcelRepo.save(parcel);

    if (saveResult.isErr()) {
      throw new InternalServerErrorException(saveResult.error.message);
    }
    return { id: parcel.id };
  }
}