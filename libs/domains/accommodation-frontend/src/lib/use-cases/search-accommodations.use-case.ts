import { Injectable } from '@nestjs/common';
import { Result, ok, err } from 'neverthrow';
import { AccommodationApiClient } from '@going-monorepo-clean/accommodation-api-client';
import { SearchAccommodationDto } from '@going-monorepo-clean/domains-accommodation-application';

export interface AccommodationViewModel {
    id: string;
    title: string;
    description: string;
    pricePerNight: number;
    city: string;
}

@Injectable()
export class SearchAccommodationsUseCase {
    private readonly apiClient: AccommodationApiClient;

    constructor() {
        this.apiClient = new AccommodationApiClient();
    }

    async execute(filters: SearchAccommodationDto): Promise<Result<AccommodationViewModel[], Error>> {
        const result = await this.apiClient.search(filters);

        if (result.isErr()) {
            return err(result.error);
        }

        const viewModels: AccommodationViewModel[] = result.value.map(dto => ({
            id: dto.id,
            title: dto.title,
            description: dto.description,
            pricePerNight: dto.pricePerNight.amount / 100,
            city: dto.location.city,
        }));

        return ok(viewModels);
    }
}
