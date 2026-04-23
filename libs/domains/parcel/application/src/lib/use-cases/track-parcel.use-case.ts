import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  Parcel,
  IParcelRepository,
} from '@going-monorepo-clean/domains-parcel-core';

@Injectable()
export class TrackParcelUseCase {
  constructor(
    @Inject(IParcelRepository)
    private readonly parcelRepo: IParcelRepository,
  ) {}

  async execute(trackingCode: string): Promise<any> {
    const result = await this.parcelRepo.findByTrackingCode(trackingCode);

    if (result.isErr()) {
      throw new Error(result.error.message);
    }

    const parcel = result.value;
    if (!parcel) {
      throw new NotFoundException('Envío no encontrado');
    }

    const primitives = parcel.toPrimitives();
    return {
      trackingCode: primitives.trackingCode,
      status: primitives.status,
      from: primitives.origin.address,
      to: primitives.destination.address,
      size: primitives.description,
      createdAt: primitives.createdAt,
    };
  }
}
