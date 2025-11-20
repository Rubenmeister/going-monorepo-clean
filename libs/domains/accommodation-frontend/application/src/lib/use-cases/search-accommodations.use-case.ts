import { Inject, Injectable } from '@nestjs/common';
import { Result } from 'neverthrow';
import {
  Accommodation,
  IAccommodationRepository,
  SearchFilters
} from '@going-monorepo-clean/domains-accommodation-frontend-core';
import { SearchAccommodationDto } from '../dto/search-accommodation.dto';

@Injectable()
export class SearchAccommodationsUseCase {
  constructor(
    @Inject(IAccommodationRepository)
    private readonly repository: IAccommodationRepository
  ) {}

  async execute(filters: SearchAccommodationDto): Promise<Result<Accommodation[], Error>> {
    // Nota: La conversión de DTO a SearchFilters es segura ya que ambos tipos tienen campos opcionales similares
    return this.repository.search(filters as SearchFilters);
  }
}