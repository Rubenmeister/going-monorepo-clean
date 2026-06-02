import { Inject, Injectable } from '@nestjs/common';
import { Result, ok, err } from 'neverthrow';
import { ITourRepository, TourFilters } from '@going-monorepo-clean/domains-tour-frontend-core';

export interface TourViewModel {
  id: string;
  title: string;
  priceDollars: number;
  city: string;
  duration: number;
  category: string;
}

@Injectable()
export class SearchToursUseCase {
  constructor(
    @Inject(ITourRepository)
    private readonly repository: ITourRepository,
  ) {}

  async execute(filters: TourFilters): Promise<Result<TourViewModel[], Error>> {
    const result = await this.repository.searchPublished(filters);

    if (result.isErr()) return err(result.error);

    const viewModels: TourViewModel[] = result.value.map((t) => ({
      id: t.id,
      title: t.title,
      priceDollars: t.price.amount / 100,
      city: t.location.city,
      duration: t.durationHours,
      category: t.category,
    }));

    return ok(viewModels);
  }
}
