import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { I_PARCEL_REPOSITORY, ParcelStatus } from '@going-monorepo-clean/domains-parcel-core';
import type { IParcelRepository } from '@going-monorepo-clean/domains-parcel-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

export type UserParcelDto = {
  id: UUID;
  status: ParcelStatus;
  description: string;
  originAddress: string;
  destinationAddress: string;
  price: number;
  currency: string;
  createdAt: Date;
};

@Injectable()
export class FindParcelsByUserUseCase {
  constructor(
    @Inject(I_PARCEL_REPOSITORY)
    private readonly parcelRepo: IParcelRepository,
  ) {}

  async execute(userId: UUID): Promise<UserParcelDto[]> {
    const parcelsResult = await this.parcelRepo.findByUserId(userId);

    if (parcelsResult.isErr()) {
      throw new InternalServerErrorException(parcelsResult.error.message);
    }
    const parcels = parcelsResult.value;

    return parcels.map((parcel) => {
      const props = parcel.toPrimitives();
      return {
        id: props.id,
        status: props.status,
        description: props.description,
        originAddress: props.origin.address,
        destinationAddress: props.destination.address,
        price: props.price.amount,
        currency: props.price.currency,
        createdAt: props.createdAt,
      };
    });
  }
}