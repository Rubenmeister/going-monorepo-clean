import { Injectable } from '@nestjs/common';
import { Result, ok, err } from 'neverthrow';
import { ExperienceApiClient } from '@going-monorepo-clean/experience-api-client';

export interface ExperienceViewModel {
    id: string;
    title: string;
    priceDollars: number;
    city: string;
    duration: number;
}

export interface SearchExperienceDto {
    city?: string;
    maxPrice?: number;
}

@Injectable()
export class SearchExperiencesUseCase {
    private readonly apiClient: ExperienceApiClient;

    constructor() {
        this.apiClient = new ExperienceApiClient();
    }

    async execute(filters: SearchExperienceDto): Promise<Result<ExperienceViewModel[], Error>> {
        const result = await this.apiClient.search(filters);

        if (result.isErr()) {
            return err(result.error);
        }

        const viewModels: ExperienceViewModel[] = result.value.map(dto => ({
            id: dto.id,
            title: dto.title,
            priceDollars: dto.price.amount / 100,
            city: dto.location.city,
            duration: dto.durationHours,
        }));

        return ok(viewModels);
    }
}
