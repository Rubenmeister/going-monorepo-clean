import { Result } from 'neverthrow';
import { Accommodation, IAccommodationRepository, SearchFilters } from '@going-monorepo-clean/domains-accommodation-frontend-core';
export declare class SearchAccommodationsUseCase {
    private readonly repository;
    constructor(repository: IAccommodationRepository);
    execute(filters: SearchFilters): Promise<Result<Accommodation[], Error>>;
}
