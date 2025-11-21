import { Inject, Injectable } from '@nestjs/common';
import { Result, ok, err } from 'neverthrow';
import { SearchAccommodationDto } from '../dto/search-accommodation.dto';
import { AccommodationApiClient, AccommodationDto } from '@going-monorepo-clean/accommodation-api-client'; // <--- NUEVA DEPENDENCIA

// --- View Model (Nuevo Modelo Simple para la UI) ---
// La UI solo necesita esto, no una entidad DDD compleja
export interface AccommodationViewModel {
    id: string;
    title: string;
    price: number;
    city: string;
}

@Injectable()
export class SearchAccommodationsUseCase {
    private readonly apiClient: AccommodationApiClient;

    constructor() {
        // En un monorepo de frontend, instanciamos el cliente aquí
        this.apiClient = new AccommodationApiClient(); 
    }

    async execute(filters: SearchAccommodationDto): Promise<Result<AccommodationViewModel[], Error>> {
        // 1. Llamar al Adaptador (API Client)
        const result = await this.apiClient.search(filters);

        if (result.isErr()) {
            return err(result.error);
        }
        
        // 2. Mapear DTOs simples a View Models (Transformación)
        const viewModels: AccommodationViewModel[] = result.value.map(dto => ({
            id: dto.id,
            title: dto.title,
            price: dto.pricePerNight.amount / 100, // Convierte centavos a dólares para la UI
            city: dto.location.city,
        }));

        return ok(viewModels);
    }
}