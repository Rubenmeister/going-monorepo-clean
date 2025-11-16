import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ITrackingRepository } from '@going-monorepo-clean/domains-tracking-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

export type ActiveDriverLocationDto = {
  driverId: UUID;
  latitude: number;
  longitude: number;
  updatedAt: Date;
};

@Injectable()
export class GetActiveDriversUseCase {
  constructor(
    @Inject(ITrackingRepository)
    private readonly trackingRepo: ITrackingRepository,
  ) {}

  async execute(): Promise<ActiveDriverLocationDto[]> {
    const locationsResult = await this.trackingRepo.findAllActive();

    if (locationsResult.isErr()) {
      throw new InternalServerErrorException(locationsResult.error.message);
    }
    const locations = locationsResult.value;

    return locations.map((loc) => {
      const props = loc.toPrimitives();
      return {
        driverId: props.driverId,
        latitude: props.location.latitude,
        longitude: props.location.longitude,
        updatedAt: props.updatedAt,
      };
    });
  }
}