import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  Parcel,
  IParcelRepository,
} from '@going-monorepo-clean/domains-parcel-core';
import { Money, Location } from '@going-monorepo-clean/shared-domain';
import { CreateParcelDto } from '../dto/create-parcel.dto';

@Injectable()
export class CreateParcelUseCase {
  constructor(
    @Inject(IParcelRepository)
    private readonly parcelRepo: IParcelRepository,
  ) {}

  async execute(dto: CreateParcelDto): Promise<{ id: string; trackingCode: string; otpPin: string }> {
    // Money tiene constructor privado: usar el factory create() y validar.
    const priceVOResult = Money.create(dto.price.amount, dto.price.currency);
    if (priceVOResult.isErr()) {
      throw new InternalServerErrorException(
        `Invalid price: ${priceVOResult.error.message}`,
      );
    }
    const priceVO = priceVOResult.value;
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
      price: priceVO,
      paymentMethod: dto.paymentMethod,
      payerRole: dto.payerRole,
      recipientPhone: dto.recipientPhone,
      recipientName: dto.recipientName,
    });

    if (parcelResult.isErr()) {
      throw new InternalServerErrorException(parcelResult.error.message);
    }

    const parcel = parcelResult.value;
    const saveResult = await this.parcelRepo.save(parcel);

    if (saveResult.isErr()) {
      throw new InternalServerErrorException(saveResult.error.message);
    }
    return {
      id: parcel.id,
      trackingCode: parcel.trackingCode,
      otpPin: parcel.otpPin,
      paymentMethod: parcel.paymentMethod,
      payerRole: parcel.payerRole,
      paymentStatus: parcel.paymentStatus,
      status: parcel.status,
    };
  }
}