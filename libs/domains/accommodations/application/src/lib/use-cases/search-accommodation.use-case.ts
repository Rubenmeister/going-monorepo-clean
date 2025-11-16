import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  IAccommodationRepository,
  SearchFilters,
} from '@going-monorepo-clean/domains-accommodation-core';
import { SearchAccommodationDto } from '../dto/search-accommodation.dto';

export type AccommodationSearchResultDto = {
  id: string;
  title: string;
  city: string;
  country: string;
  price: number;
  currency: string;
  capacity: number;
};

@Injectable()
export class SearchAccommodationUseCase {
  constructor(
    @Inject(IAccommodationRepository)
    private readonly accommodationRepo: IAccommodationRepository,
  ) {}

  async execute(
    filters: SearchAccommodationDto,
  ): Promise<AccommodationSearchResultDto[]> {
    const resultsResult = await this.accommodationRepo.search(filters as SearchFilters);
    if (resultsResult.isErr()) {
      throw new InternalServerErrorException(resultsResult.error.message);
    }
    const results = resultsResult.value;

    return results.map((acc) => {
      const props = acc.toPrimitives();
      return {
        id: props.id,
        title: props.title,
        city: props.location.city,
        country: props.location.country,
        price: props.pricePerNight.amount,
        currency: props.pricePerNight.currency,
        capacity: props.capacity,
      };
    });
  }
}