import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { IAccommodationRepository } from '@going-monorepo-clean/domains-accommodation-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

export type HostAccommodationDto = {
  id: UUID;
  title: string;
  city: string;
  status: string;
  price: number;
  currency: string;
  capacity: number;
};

@Injectable()
export class GetAccommodationsByHostUseCase {
  constructor(
    @Inject(IAccommodationRepository)
    private readonly accommodationRepo: IAccommodationRepository,
  ) {}

  async execute(hostId: UUID): Promise<HostAccommodationDto[]> {
    const result = await this.accommodationRepo.findByHostId(hostId);

    if (result.isErr()) {
      throw new InternalServerErrorException(result.error.message);
    }

    return result.value.map((acc) => {
      const p = acc.toPrimitives();
      return {
        id: p.id,
        title: p.title,
        city: p.location.city,
        status: p.status,
        price: p.pricePerNight.amount,
        currency: p.pricePerNight.currency,
        capacity: p.capacity,
      };
    });
  }
}
