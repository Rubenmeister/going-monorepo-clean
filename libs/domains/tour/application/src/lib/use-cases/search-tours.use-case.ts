import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ITourRepository, TourSearchFilters } from '@going-monorepo-clean/domains-tour-core';
import { UUID } from '@going-monorepo-clean/shared-domain';

export type TourSearchResultDto = {
  id: UUID;
  title: string;
  city: string;
  country: string;
  price: number;
  currency: string;
  durationHours: number;
  maxGuests: number;
  category: string;
};

@Injectable()
export class SearchToursUseCase {
  constructor(
    @Inject(ITourRepository)
    private readonly tourRepo: ITourRepository,
  ) {}

  async execute(filters: TourSearchFilters): Promise<TourSearchResultDto[]> {
    const result = await this.tourRepo.searchPublished(filters);

    if (result.isErr()) {
      throw new InternalServerErrorException(result.error.message);
    }

    return result.value.map((tour) => {
      const p = tour.toPrimitives();
      return {
        id: p.id,
        title: p.title,
        city: p.location.city,
        country: p.location.country,
        price: p.price.amount,
        currency: p.price.currency,
        durationHours: p.durationHours,
        maxGuests: p.maxGuests,
        category: p.category,
      };
    });
  }
}
