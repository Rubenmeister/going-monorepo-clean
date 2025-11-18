import { Inject, Injectable } from '@nestjs/common'; // O tu inyector simple
import { Result } from 'neverthrow';
import {
  Accommodation,
  IAccommodationRepository,
  SearchFilters
} from '@going-monorepo-clean/domains-accommodation-frontend-core';

@Injectable()
export class SearchAccommodationsUseCase {
  constructor(
    @Inject(IAccommodationRepository)
    private readonly repository: IAccommodationRepository
  ) {}

  async execute(filters: SearchFilters): Promise<Result<Accommodation[], Error>> {
    return this.repository.search(filters);
  }
}