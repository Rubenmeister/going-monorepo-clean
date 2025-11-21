import { Injectable } from '@nestjs/common';
import { Result, ok, err } from 'neverthrow';
import { ExperienceApiClient } from '@going-monorepo-clean/experience-api-client';
import { SearchExperienceDto } from '../dto/search-experience.dto';

// --- View Model (Nuevo Modelo Simple para la UI) ---
export interface ExperienceViewModel {
    id: string;
    title: string;
    priceDollars: number;
    city: string;
    duration: number;
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
        
        // 2. Mapear DTOs simples a View Models (Transformación)
        const viewModels: ExperienceViewModel[] = result.value.map(dto => ({
            id: dto.id,
            title: dto.title,
            priceDollars: dto.price.amount / 100, // Convierte centavos a dólares
            city: dto.location.city,
            duration: dto.durationHours,
        }));

        return ok(viewModels);
    }
}