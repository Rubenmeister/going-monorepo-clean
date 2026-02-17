import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  ITourRepository,
  TourSearchFilters,
} from '@going-monorepo-clean/domains-tour-core';

@Injectable()
export class SearchToursUseCase {
  constructor(
    @Inject(ITourRepository)
    private readonly tourRepo: ITourRepository,
  ) {}

  async execute(filters: TourSearchFilters): Promise<any[]> {
    const result = await this.tourRepo.searchPublished(filters);

    if (result.isErr()) {
      throw new InternalServerErrorException(result.error.message);
    }

    return result.value.map((tour) => tour.toPrimitives());
  }
}
