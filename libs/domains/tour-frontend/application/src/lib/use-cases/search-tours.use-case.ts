import { Injectable } from '@nestjs/common';
import { Result, ok, err } from 'neverthrow';
import { TourApiClient } from '@going-monorepo-clean/tour-api-client'; // <--- NUEVA DEPENDENCIA
import { SearchExperienceDto } from '../../experience-frontend/application/src/lib/dto/search-experience.dto'; // Reutilizamos DTO

// --- View Model ---
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
    private readonly apiClient: TourApiClient;

    constructor() {
        this.apiClient = new TourApiClient(); 
    }

    async execute(filters: SearchExperienceDto): Promise<Result<TourViewModel[], Error>> {
        // 1. Llamar al Adaptador (API Client)
        const result = await this.apiClient.search({ city: filters.city, category: 'ADVENTURE' }); // Filtros de ejemplo

        if (result.isErr()) {
            return err(result.error);
        }
        
        // 2. Mapear DTOs simples a View Models
        const viewModels: TourViewModel[] = result.value.map(dto => ({
            id: dto.id,
            title: dto.title,
            priceDollars: dto.price.amount / 100,
            city: dto.location.city,
            duration: dto.durationHours,
            category: dto.category,
        }));

        return ok(viewModels);
    }
}