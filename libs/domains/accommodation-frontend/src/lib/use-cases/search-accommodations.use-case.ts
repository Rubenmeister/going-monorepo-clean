import { Inject, Injectable } from '@nestjs/common'; // O tu inyector simple
import { Result } from 'neverthrow';
// El split a un lib '-core' nunca se completó; estos símbolos viven localmente.
import { Accommodation } from '../entities/accommodation.entity';
import {
  IAccommodationRepository,
  SearchFilters,
} from '../ports/iaccommodation.repository';

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