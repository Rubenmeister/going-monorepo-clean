import { Inject, Injectable } from '@nestjs/common';
import { Result, ok, err } from 'neverthrow';
import { SearchAccommodationDto } from '../dto/search-accommodation.dto';
import { IAccommodationRepository, Accommodation } from '@going-monorepo-clean/domains-accommodation-frontend-core';

export interface AccommodationViewModel {
  id: string;
  title: string;
  price: number;
  city: string;
}

@Injectable()
export class SearchAccommodationsUseCase {
  constructor(
    @Inject(IAccommodationRepository)
    private readonly repository: IAccommodationRepository,
  ) {}

  async execute(filters: SearchAccommodationDto): Promise<Result<AccommodationViewModel[], Error>> {
    const result = await this.repository.search(filters);

    if (result.isErr()) return err(result.error);

    const viewModels: AccommodationViewModel[] = result.value.map((a) => ({
      id: a.id,
      title: a.title,
      price: a.pricePerNight.amount / 100,
      city: a.location.city,
    }));

    return ok(viewModels);
  }
}
