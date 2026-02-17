import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ILocationHistoryRepository } from '@going-monorepo-clean/domains-tracking-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

export type TripRoutePointDto = {
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  recordedAt: Date;
};

@Injectable()
export class GetTripRouteUseCase {
  constructor(
    @Inject(ILocationHistoryRepository)
    private readonly historyRepo: ILocationHistoryRepository,
  ) {}

  async execute(tripId: UUID): Promise<TripRoutePointDto[]> {
    const result = await this.historyRepo.findByTripId(tripId);

    if (result.isErr()) {
      throw new InternalServerErrorException(result.error.message);
    }

    return result.value.map((record) => {
      const props = record.toPrimitives();
      return {
        latitude: (props.location as any).latitude,
        longitude: (props.location as any).longitude,
        speed: props.speed as number | undefined,
        heading: props.heading as number | undefined,
        recordedAt: props.recordedAt as Date,
      };
    });
  }
}
