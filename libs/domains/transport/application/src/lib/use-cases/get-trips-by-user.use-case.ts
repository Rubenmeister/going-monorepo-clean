import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ITripRepository } from '@going-monorepo-clean/domains-transport-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

export type UserTripDto = {
  id: UUID;
  origin: { address: string; city: string };
  destination: { address: string; city: string };
  status: string;
  price: number;
  currency: string;
  driverId?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
};

@Injectable()
export class GetTripsByUserUseCase {
  constructor(
    @Inject(ITripRepository)
    private readonly tripRepo: ITripRepository,
  ) {}

  async execute(userId: UUID): Promise<UserTripDto[]> {
    const result = await this.tripRepo.findTripsByUser(userId);

    if (result.isErr()) {
      throw new InternalServerErrorException(result.error.message);
    }

    return result.value.map((trip) => {
      const p = trip.toPrimitives();
      return {
        id: p.id,
        origin: { address: p.origin.address, city: p.origin.city },
        destination: { address: p.destination.address, city: p.destination.city },
        status: p.status,
        price: p.price.amount,
        currency: p.price.currency,
        driverId: p.driverId,
        createdAt: p.createdAt,
        startedAt: p.startedAt,
        completedAt: p.completedAt,
      };
    });
  }
}
