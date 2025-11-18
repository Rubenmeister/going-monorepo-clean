import { Inject, Injectable } from '@nestjs/common';
import { Result } from 'neverthrow';
import {
  Tour,
  ITourRepository,
  TourFilters
} from '@going-monorepo-clean/domains-tour-frontend-core';

@Injectable()
export class SearchToursUseCase {
  constructor(
    @Inject(ITourRepository)
    private readonly repository: ITourRepository
  ) {}

  async execute(filters: TourFilters): Promise<Result<Tour[], Error>> {
    return this.repository.search(filters);
  }
}